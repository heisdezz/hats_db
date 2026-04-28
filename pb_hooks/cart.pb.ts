// routerAdd(
//   "GET",
//   "/cart/add",
//   (e) => {
//     const body = e.requestInfo().body;

//     return e.json(200, {
//       data: body,
//       message: "added-to-cart",
//     });
//   },
//   $apis.requireAuth(),
// );
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
