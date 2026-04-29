// routerAdd(
//   "GET",
//   "/cart/add",
//   (e) => {
//     const body = e.requestInfo().body;

// import { getJSDocReturnType } from "typescript";

//     return e.json(200, {
//       data: body,
//       message: "added-to-cart",
//     });
//   },
//   $apis.requireAuth(),
// );
//

routerAdd(
  "GET",
  "/cart/breakdown",
  (e) => {
    const userId = e.auth?.id;

    const all_cart = e.app.findAllRecords(
      "cart",
      $dbx.exp("user = {:user}", { user: userId }),
    );
    let cart_total = 0;
    const cartItems = [];
    try {
      for (let item of all_cart) {
        const product_id = item?.getString("product") ?? "";
        const product = e.app.findRecordById("products", product_id);
        const product_price = product.getFloat("price");
        // console.log("item", JSON.stringify(item));
        const item_amount = item?.getInt("amount") ?? 0;
        // console.log(product_price, item_amount);
        const item_total_price = product_price * item_amount;
        const cartItem = {
          id: item?.id,
          amount: item_amount,
          price: item_total_price,
          product_details: product,
        };
        cartItems.push(cartItem);
        cart_total += item_total_price;
      }
      // console.log(JSON.stringify(cartItems));
      return e.json(200, {
        data: {
          cart_breakdown: {
            subtotal: cart_total,
            deliveryFee: 4000,
            total: cart_total + 4000,
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
      // console.log(JSON.stringify({ userId, id }));
      const record = e.app.findFirstRecordByFilter(
        "cart",
        "product = {:id} && user = {:user}",
        { id: id, user: userId },
      );
      return e.json(200, {
        data: true,
        message: "Product in Cart",
      });
    } catch (err) {
      if (err) {
        console.log(err);
      }
      return e.json(200, {
        data: false,
        message: "Product not in Cart",
      });
    }
  },
  $apis.requireAuth(),
);

onRecordCreateRequest((e) => {
  const userId = e.auth?.id;
  const body = e.requestInfo().body;
  e.record?.set("user", userId);
  const record_details = e.record?.get("product");
  // console.log(JSON.stringify(record_details), "body");
  e.next();
}, "cart");

routerAdd(
  "POST",
  "/checkout",
  (e) => {
    // @ts-ignore
    const utils = require(`${__hooks}/utils.js`);

    const secret = utils.secret;
    const userId = e.auth?.id;
    const user_email = e.auth?.get("email");
    const check_collection =
      e.app.findCollectionByNameOrId("checkout_sessions");
    try {
      const all_cart = e.app.findAllRecords(
        "cart",
        $dbx.exp("user = {:user}", { user: userId }),
      );
      if (!all_cart.length) {
        return e.json(400, { message: "Cart is empty" });
      }

      const deliveryFee = 5000;
      let cart_total = 0;
      const cartItems = [];
      try {
        for (let item of all_cart) {
          const product_id = item?.getString("product") ?? "";
          const product = e.app.findRecordById("products", product_id);
          const product_price = product.getFloat("price");
          // console.log("item", JSON.stringify(item));
          const item_amount = item?.getInt("amount") ?? 0;
          // console.log(product_price, item_amount);
          const item_total_price = product_price * item_amount;
          const cartItem = {
            id: item?.id,
            amount: item_amount,
            price: item_total_price,
            product_details: product,
          };
          cartItems.push(cartItem);
          cart_total += item_total_price;
        }
        // console.log(JSON.stringify(cartItems));
        const cart_items_stringified = JSON.stringify(cartItems);
        const cart_hash = $security.md5(cart_items_stringified);
        if (cartItems.length == 0)
          return e.json(400, { message: "Cart is empty" });
        let checkout_session = null;
        try {
          const record = e.app.findFirstRecordByData(
            "checkout_sessions",
            "user",
            userId,
          );
          checkout_session = record;
        } catch (err) {
          console.log(err, "error at find");
        }
        // console.log("checkout_session");
        const total = cart_total + deliveryFee;
        //when no checkout session
        if (!checkout_session) {
          const reference = $security.randomString(12);
          const new_check = new Record(check_collection, {
            user: userId,
            hash: cart_hash,
            reference: reference,
            status: "pending",
          });
          e.app.save(new_check);
          e.next();

          const res = $http.send({
            method: "POST",
            url: "https://api.paystack.co/transaction/initialize",
            headers: {
              Authorization: "Bearer " + secret,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: user_email,
              amount: total * 100,
              reference,
            }),
          });
          if (res.statusCode !== 200) {
            throw new Error("Paystack error: " + res.raw);
          }
          const parsed = JSON.parse(res.raw);

          return e.json(200, {
            data: {
              reference,
              total: total * 100,
              paystack: parsed.data,
            },
            message: "Checkout",
          });
        }

        const hash = checkout_session.get("hash");
        if (hash == cart_hash) {
          const reference = checkout_session.get("reference");
          return e.json(200, {
            data: {
              message: "checkout",
              reference,
              total: cart_total * 100,
              access_code: checkout_session.get("access_code"),
              paystack: null,
            },
          });
        }
        //creating checkout session
        const reference = $security.randomString(12);
        // const new_check = new Record(check_collection, {
        //   user: userId,
        //   hash: cart_hash,
        //   reference: reference,
        //   status: "pending",
        // });
        //
        checkout_session.set("hash", cart_hash);
        checkout_session.set("reference", reference);
        checkout_session.set("status", "pending");
        e.app.save(checkout_session);
        e.next();

        const res = $http.send({
          method: "POST",
          url: "https://api.paystack.co/transaction/initialize",
          headers: {
            Authorization: "Bearer " + secret,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: user_email,
            amount: total * 100,
            reference,
          }),
        });
        if (res.statusCode !== 200) {
          throw new Error("Paystack error: " + res.raw);
        }
        const parsed = JSON.parse(res.raw);
        checkout_session.set("access_code", parsed.data.access_code);
        e.app.save(checkout_session);
        return e.json(200, {
          data: {
            reference,
            total: total * 100,

            paystack: parsed.data,
          },
          message: "Checkout",
        });
      } catch (err) {
        console.log(err);
        return e.json(500, {});
      }
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
    const userid = e.auth?.id;
    const reference = e.requestInfo().body.reference;
    //@ts-ignore
    const utils = require(`${__hooks}/utils.js`);

    if (!reference) {
      return e.json(400, { message: "Reference is required" });
    }

    const check_session = e.app.findFirstRecordByData(
      "checkout_sessions",
      "user",
      userid,
    );

    const ref = check_session?.getString("reference");
    const amount = check_session?.getInt("amount");

    const secret = utils.secret;
    if (!secret) {
      return e.json(500, { message: "PAYSTACK_SECRET_KEY is not set" });
    }

    try {
      const session = check_session;
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
      const pay_ref = parsed.data.reference;
      if (pay_ref !== ref) {
        return e.json(402, { message: "Payment not completed" });
      }
      session.set("status", "paid");
      e.app.save(session);

      const order_col = e.app.findCollectionByNameOrId("orders");
      const user_profile = e.app.findFirstRecordByData(
        "profile",
        "user",
        userid,
      );
      const delivery_location = e.app.findFirstRecordByData(
        "deliverySettings",
        "profile",
        user_profile.getString("id"),
      );

      const all_cart = e.app.findAllRecords(
        "cart",
        $dbx.exp("user = {:user}", { user: userid }),
      );

      for (const item of all_cart) {
        if (!item) return;
        const product_id = item.getString("product");
        const product = e.app.findRecordById("products", product_id);
        const item_count = item.getInt("amount");
        const new_order = new Record(order_col);
        new_order.set("user", userid);
        new_order.set("product", product_id);
        new_order.set("amount", item_count);
        new_order.set("profile", user_profile);
        new_order.set("price", product.getFloat("price") * item_count);
        new_order.set("status", "pending");
        new_order.set("extraInfo", item.getString("extraInfo"));
        new_order.set("deliveryLocation", {
          lat: delivery_location?.getFloat("lat"),
          lng: delivery_location?.getFloat("lng"),
        });
        new_order.set("checkout_session", session.id);
        e.app.saveNoValidate(new_order);
        //@ts-ignore
        e.app.delete(item);
      }

      session.set("status", "fulfilled");
      e.app.save(session);
      //@ts-ignore
      $app.store().remove(userid);
      e.app.delete(session);
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
