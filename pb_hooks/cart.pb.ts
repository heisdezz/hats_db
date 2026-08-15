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
      const {
        cartItems,
        cart_total,
        total_cart_space,
        hat_count,
      } = utils.build_cart_items(e.app, all_cart);

      const {
        deliveryFee,
        hatCount,
        baseFee,
        additionalHatFee,
      } = utils.calculate_delivery_fee(e.app, cartItems);

      const total = cart_total + deliveryFee;

      return e.json(200, {
        data: {
          cart_breakdown: {
            subtotal: cart_total,
            deliveryFee: deliveryFee,
            total: total,
            total_cart_space: total_cart_space,
            max_cart_space: 20,
            hat_count: hatCount,
            base_fee: baseFee,
            additional_hat_fee: additionalHatFee,
          },
          cart_items: cartItems,
        },
        message: "Product in Cart",
      });
    } catch (err) {
      console.log(err);
      return e.json(500, { message: err?.message || "Internal Server Error" });
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
  const utils = require(`${__hooks}/utils.js`);
  utils.check_cart_space_limit(e.app, e);
  e.next();
}, "cart");

onRecordUpdateRequest((e) => {
  const utils = require(`${__hooks}/utils.js`);
  utils.check_cart_space_limit(e.app, e);
  e.next();
}, "cart");
