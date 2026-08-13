/// <reference path="../pb_data/types.d.ts" />

routerAdd(
  "GET",
  "/cart/breakdown",
  (e) => {
    const utils = require(`${__hooks}/utils.js`);
    const userId = e.auth?.id;

    try {
      const delivery_record = e.app.findFirstRecordByData(
        "deliverySettings",
        "user",
        userId,
      );
      const fullAddress = delivery_record?.getString("fullAddress");
      if (!fullAddress) {
        return e.json(400, { data: null, message: "update delivery settings" });
      }
    } catch (_) {
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
