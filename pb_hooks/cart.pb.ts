routerAdd(
  "GET",
  "/cart/breakdown",
  (e) => {
    const utils = require(`${__hooks}/utils.js`);
    const userId = e.auth?.id;

    const delivery_record = e.app.findFirstRecordByData(
      "deliverySettings",
      "user",
      userId,
    );
    const fullAddress = delivery_record.getString("fullAddress");
    if (!fullAddress) {
      return e.json(400, { data: null, message: "update delivery settings" });
    }

    const all_cart = e.app.findAllRecords(
      "cart",
      $dbx.exp("user = {:user}", { user: userId }),
    );

    try {
      const { cartItems, cart_total } = utils.build_cart_items(e.app, all_cart);
      return e.json(200, {
        data: {
          cart_breakdown: {
            subtotal: cart_total,
            total: cart_total,
          },
          cart_items: cartItems,
        },
        message: "Product in Cart",
      });
    } catch (err) {
      console.log(err);
      return e.json(500, {});
    }
  },
  $apis.requireAuth(),
);

routerAdd(
  "GET",
  "/cart/{id}",
  (e) => {
    const id = e.request?.pathValue("id");
    const userId = e.auth?.id;
    try {
      e.app.findFirstRecordByFilter(
        "cart",
        "product = {:id} && user = {:user}",
        { id, user: userId },
      );
      return e.json(200, { data: true, message: "Product in Cart" });
    } catch (err) {
      if (err) console.log(err);
      return e.json(200, { data: false, message: "Product not in Cart" });
    }
  },
  $apis.requireAuth(),
);

onRecordCreateRequest((e) => {
  e.record?.set("user", e.auth?.id);
  e.next();
}, "cart");

routerAdd(
  "POST",
  "/checkout",
  (e) => {
    const utils = require(`${__hooks}/utils.js`);
    const secret = utils.secret;
    const userId = e.auth?.id;
    const user_email = e.auth?.get("email");
    const check_collection =
      e.app.findCollectionByNameOrId("checkout_sessions");

    const delivery_record = e.app.findFirstRecordByData(
      "deliverySettings",
      "user",
      userId,
    );
    const fullAddress = delivery_record.getString("fullAddress");
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
      const { cartItems, cart_total } = utils.build_cart_items(e.app, all_cart);
      if (!cartItems.length) {
        return e.json(400, { message: "Cart is empty" });
      }

      const cart_hash = $security.md5(JSON.stringify(cartItems));
      const total = cart_total;

      let checkout_session = null;
      try {
        checkout_session = e.app.findFirstRecordByData(
          "checkout_sessions",
          "user",
          userId,
        );
      } catch (err) {
        console.log(err, "no existing checkout session");
      }

      if (!checkout_session) {
        const reference = $security.randomString(12);
        const new_check = new Record(check_collection, {
          user: userId,
          hash: cart_hash,
          reference,
          status: "pending",
          cart_items: JSON.stringify(cartItems),
        });
        e.app.save(new_check);

        const parsed = utils.paystack_initialize(secret, {
          email: user_email,
          amount: total * 100,
          reference,
        });
        new_check.set("access_code", parsed.data.access_code);
        e.app.save(new_check);

        return e.json(200, {
          data: {
            reference,
            total: total * 100,
            access_code: parsed.data.access_code,
            paystack: parsed.data,
          },
          message: "Checkout",
        });
      }

      if (checkout_session.get("hash") === cart_hash) {
        const reference = checkout_session.getString("reference");
        let access_code = checkout_session.getString("access_code");
        if (!access_code) {
          const parsed = utils.paystack_initialize(secret, {
            email: user_email,
            amount: total * 100,
            reference,
          });
          access_code = parsed.data.access_code;
          checkout_session.set("access_code", access_code);
        }
        e.app.save(checkout_session);
        return e.json(200, {
          data: {
            reference,
            total: total * 100,
            access_code,
            paystack: null,
          },
          message: "Checkout",
        });
      }

      const reference = $security.randomString(12);
      checkout_session.set("hash", cart_hash);
      checkout_session.set("reference", reference);
      checkout_session.set("status", "pending");
      checkout_session.set("cart_items", JSON.stringify(cartItems));
      checkout_session.set("access_code", "");
      e.app.save(checkout_session);

      const parsed = utils.paystack_initialize(secret, {
        email: user_email,
        amount: total * 100,
        reference,
      });
      checkout_session.set("access_code", parsed.data.access_code);
      e.app.save(checkout_session);

      return e.json(200, {
        data: {
          reference,
          access_code: parsed.data.access_code,
          total: total * 100,
          paystack: parsed.data,
        },
        message: "Checkout",
      });
    } catch (err) {
      console.log(err);
      return e.json(500, { message: "Internal Server Error" });
    }
  },
  $apis.requireAuth(),
);

routerAdd(
  "POST",
  "/checkout/validate",
  (e) => {
    const utils = require(`${__hooks}/utils.js`);
    const secret = utils.secret;
    const userid = e.auth?.id;
    const reference = e.requestInfo().body.reference;

    if (!reference) {
      return e.json(400, { message: "Reference is required" });
    }

    const check_session = e.app.findFirstRecordByData(
      "checkout_sessions",
      "user",
      userid,
    );
    const ref = check_session?.getString("reference");

    try {
      const res = $http.send({
        method: "GET",
        url: `https://api.paystack.co/transaction/verify/${reference}`,
        headers: { Authorization: "Bearer " + secret },
      });
      if (res.statusCode !== 200) throw new Error("Paystack error: " + res.raw);

      const parsed = JSON.parse(res.raw);
      if (parsed.data.status !== "success") {
        return e.json(402, { message: "Payment not completed" });
      }
      if (parsed.data.reference !== ref) {
        return e.json(402, { message: "Payment reference mismatch" });
      }

      const session = check_session;
      session.set("status", "paid");
      e.app.save(session);

      const all_cart = e.app.findAllRecords(
        "cart",
        $dbx.exp("user = {:user}", { user: userid }),
      );
      const check_cart_items = JSON.parse(session.get("cart_items"));

      const order_items_col = e.app.findCollectionByNameOrId("order_items");
      const order_item_ids = [];
      let total_price = 0;

      for (const item of all_cart) {
        if (!item) continue;
        const product_id = item.getString("product");
        const item_count = item.getInt("amount");
        const item_details = check_cart_items.find(
          (i) => i.product_details.id === product_id,
        );
        const item_price =
          (item_details?.product_details.price ?? 0) * item_count;

        const order_item = new Record(order_items_col);
        order_item.set("originalProduct", product_id);
        order_item.set("amount", item_count);
        order_item.set("price", item_price);
        order_item.set("ref", reference);
        e.app.save(order_item);
        order_item_ids.push(order_item.id);
        total_price += item_price;

        //@ts-ignore
        e.app.delete(item);
      }

      const user_orders_col = e.app.findCollectionByNameOrId("user_orders");
      const user_order = new Record(user_orders_col);
      user_order.set("ref", reference);
      user_order.set("relation", order_item_ids);
      user_order.set("status", "pending");
      user_order.set("user", userid);
      user_order.set("totalPrice", total_price);
      e.app.save(user_order);

      session.set("status", "fulfilled");
      session.set("access_code", "");
      session.set("hash", "");
      session.set("session", "");
      session.set("cartItems", null);
      e.app.save(session);
      //@ts-ignore
      $app.store().remove(userid);

      return e.json(200, {
        data: "order_placed",
        message: "Checkout validated",
      });
    } catch (err) {
      console.log(err);
      return e.json(500, { message: "Internal server error" });
    }
  },
  $apis.requireAuth(),
);
