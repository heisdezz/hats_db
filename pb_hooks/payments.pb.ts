/// <reference path="../pb_data/types.d.ts" />

routerAdd(
  "POST",
  "/checkout",
  (e) => {
    const utils = require(`${__hooks}/utils.js`);
    const secret = utils.paystack_secret();
    const userId = e.auth?.id;
    const user_email = e.auth?.get("email");

    let delivery_record = null;
    try {
      delivery_record = e.app.findFirstRecordByData(
        "deliverySettings",
        "user",
        userId,
      );
    } catch (_) { }

    const fullAddress = delivery_record?.getString("fullAddress");
    if (!fullAddress) {
      return e.json(400, { data: null, message: "update delivery settings" });
    }

    const all_cart = e.app.findAllRecords(
      "cart",
      $dbx.exp("user = {:user}", { user: userId }),
    );
    if (!all_cart.length) {
      return e.json(400, { message: "Cart is empty" });
    }

    try {
      const { cartItems, cart_total_kobo } = utils.build_cart_items(
        e.app,
        all_cart,
      );
      if (!cartItems.length) {
        return e.json(400, { message: "Cart is empty" });
      }

      const cart_hash = $security.md5(JSON.stringify(cartItems));
      const total_kobo = cart_total_kobo;

      let checkout_session = null;
      try {
        checkout_session = e.app.findFirstRecordByData(
          "checkout_sessions",
          "user",
          userId,
        );
      } catch (_) { }

      const check_collection =
        e.app.findCollectionByNameOrId("checkout_sessions");

      if (!checkout_session) {
        const reference = $security.randomString(12);
        const new_check = new Record(check_collection, {
          user: userId,
          hash: cart_hash,
          reference: reference,
          status: "pending",
          amount_kobo: total_kobo,
          cart_items: JSON.stringify(cartItems),
        });
        e.app.save(new_check);

        const parsed = utils.paystack_initialize(secret, {
          email: user_email,
          amount: total_kobo,
          reference: reference,
        });
        new_check.set("access_code", parsed.data.access_code);
        e.app.save(new_check);

        return e.json(200, {
          data: {
            reference: reference,
            total: total_kobo,
            access_code: parsed.data.access_code,
            paystack: parsed.data,
          },
          message: "Checkout",
        });
      }

      if (
        checkout_session.getString("hash") === cart_hash &&
        checkout_session.getString("status") !== "fulfilled"
      ) {
        const reference = checkout_session.getString("reference");
        let access_code = checkout_session.getString("access_code");
        checkout_session.set("amount_kobo", total_kobo);
        if (!access_code) {
          const parsed = utils.paystack_initialize(secret, {
            email: user_email,
            amount: total_kobo,
            reference: reference,
          });
          access_code = parsed.data.access_code;
          checkout_session.set("access_code", access_code);
        }
        e.app.save(checkout_session);

        return e.json(200, {
          data: {
            reference: reference,
            total: total_kobo,
            access_code: access_code,
            paystack: null,
          },
          message: "Checkout",
        });
      }

      const reference = $security.randomString(12);
      checkout_session.set("hash", cart_hash);
      checkout_session.set("reference", reference);
      checkout_session.set("status", "pending");
      checkout_session.set("amount_kobo", total_kobo);
      checkout_session.set("cart_items", JSON.stringify(cartItems));
      checkout_session.set("access_code", "");
      e.app.save(checkout_session);

      const parsed = utils.paystack_initialize(secret, {
        email: user_email,
        amount: total_kobo,
        reference: reference,
      });
      checkout_session.set("access_code", parsed.data.access_code);
      e.app.save(checkout_session);

      return e.json(200, {
        data: {
          reference: reference,
          total: total_kobo,
          access_code: parsed.data.access_code,
          paystack: parsed.data,
        },
        message: "Checkout",
      });
    } catch (err) {
      console.log(err);
      return e.json(500, { message: err?.message || "Internal Server Error" });
    }
  },
  $apis.requireAuth(),
);

routerAdd(
  "POST",
  "/checkout/validate",
  (e) => {
    const utils = require(`${__hooks}/utils.js`);
    const secret = utils.paystack_secret();
    const userid = e.auth?.id;
    const reference = e.requestInfo().body?.reference;

    if (!reference) {
      return e.json(400, { message: "Reference is required" });
    }

    let session = null;
    try {
      session = e.app.findFirstRecordByData(
        "checkout_sessions",
        "user",
        userid,
      );
    } catch (_) { }

    if (!session || session.getString("reference") !== reference) {
      return e.json(402, { message: "Payment reference mismatch" });
    }

    if (session.getString("status") === "fulfilled") {
      return e.json(200, {
        data: "order_placed",
        message: "Checkout validated",
      });
    }

    try {
      const verifyRes = utils.paystack_verify(secret, reference);
      if (verifyRes.data?.status !== "success") {
        return e.json(402, { message: "Payment not completed" });
      }

      const expectedKobo = session.getInt("amount_kobo");
      if (expectedKobo > 0 && verifyRes.data?.amount !== expectedKobo) {
        return e.json(402, { message: "Payment amount mismatch" });
      }

      session.set("status", "paid");
      e.app.save(session);

      utils.fulfill_order(e.app, session, reference);

      return e.json(200, {
        data: "order_placed",
        message: "Checkout validated",
      });
    } catch (err) {
      console.log(err);
      return e.json(500, { message: err?.message || "Internal server error" });
    }
  },
  $apis.requireAuth(),
);

routerAdd(
  "POST",
  "/paystack/webhook",
  (e) => {
    const utils = require(`${__hooks}/utils.js`);
    let secret;
    try {
      secret = utils.paystack_secret();
    } catch (err) {
      return e.json(500, { message: "Server misconfiguration" });
    }

    const raw = toString(e.request?.body);
    const expectedSignature = $security.hs512(raw, secret);
    const reqInfo = e.requestInfo();
    const headers = reqInfo.headers || {};

    let signature = "";
    if (typeof headers.get === "function") {
      signature = headers.get("x-paystack-signature") || headers.get("X-Paystack-Signature") || "";
    }
    if (!signature) {
      for (const k of Object.keys(headers)) {
        const norm = k.toLowerCase().replace(/_/g, "-");
        if (norm === "x-paystack-signature") {
          const val = headers[k];
          if (Array.isArray(val)) signature = val[0] || "";
          else if (typeof val === "string") signature = val;
          break;
        }
      }
    }

    if (!signature || !$security.equal(expectedSignature, signature)) {
      return e.json(401, { message: "Invalid signature" });
    }

    try {
      const event = JSON.parse(raw);
      if (event?.event === "charge.success") {
        const ref = event.data?.reference;
        const amount = event.data?.amount;

        if (ref) {
          try {
            const session = e.app.findFirstRecordByData(
              "checkout_sessions",
              "reference",
              ref,
            );
            const expectedKobo = session.getInt("amount_kobo");
            if (expectedKobo > 0 && amount !== expectedKobo) {
              console.log("Webhook amount mismatch for ref " + ref);
              return e.json(200, { status: true });
            }
            utils.fulfill_order(e.app, session, ref);
          } catch (err) {
            console.log("Webhook fulfillment exception:", err);
            return e.json(500, { message: "Fulfillment error" });
          }
        }
      }
      return e.json(200, { status: true });
    } catch (err) {
      console.log("Webhook parse/processing error:", err);
      return e.json(500, { message: "Processing error" });
    }
  },
);

cronAdd("reconcile-checkouts", "*/20 * * * *", () => {
  const utils = require(`${__hooks}/utils.js`);
  let secret;
  try {
    secret = utils.paystack_secret();
  } catch (_) {
    return;
  }

  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)
    .toISOString()
    .replace("T", " ");

  try {
    const pendingSessions = $app.findAllRecords(
      "checkout_sessions",
      $dbx.exp("status = 'pending' AND updated < {:cutoff}", {
        cutoff: fiveMinAgo,
      }),
    );

    for (const session of pendingSessions) {
      const ref = session.getString("reference");
      if (!ref) continue;
      try {
        const res = utils.paystack_verify(secret, ref);
        if (res.data?.status === "success") {
          const expectedKobo = session.getInt("amount_kobo");
          if (expectedKobo === 0 || res.data?.amount === expectedKobo) {
            utils.fulfill_order($app, session, ref);
            console.log("reconcile recovered order", ref);
          }
        }
      } catch (_) {
        // Leave pending
      }
    }
  } catch (err) {
    console.log("Reconciliation cron error:", err);
  }
});
