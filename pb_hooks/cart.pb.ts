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
  "/cart/{id}",
  (e) => {
    const id = e.request?.pathValue("id");
    const userId = e.auth?.id;
    try {
      console.log(JSON.stringify({ userId, id }));
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
  console.log(JSON.stringify(record_details), "body");
  e.next();
}, "cart");
