/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const checkoutSessions = app.findCollectionByNameOrId("checkout_sessions");
  if (!checkoutSessions.fields.getByName("amount_kobo")) {
    checkoutSessions.fields.add(new NumberField({
      name: "amount_kobo",
      onlyInt: true,
    }));
    app.save(checkoutSessions);
  }

  const orderItems = app.findCollectionByNameOrId("order_items");
  if (!orderItems.fields.getByName("user")) {
    orderItems.fields.add(new RelationField({
      name: "user",
      collectionId: "_pb_users_auth_",
      maxSelect: 1,
    }));
  }
  orderItems.listRule = "@request.auth.id != '' && user = @request.auth.id";
  orderItems.viewRule = "@request.auth.id != '' && user = @request.auth.id";
  app.save(orderItems);

  const userOrders = app.findCollectionByNameOrId("user_orders");
  userOrders.listRule = "@request.auth.id != '' && user = @request.auth.id";
  userOrders.viewRule = "@request.auth.id != '' && user = @request.auth.id";
  app.save(userOrders);
}, (app) => {
  const checkoutSessions = app.findCollectionByNameOrId("checkout_sessions");
  if (checkoutSessions.fields.getByName("amount_kobo")) {
    checkoutSessions.fields.removeByName("amount_kobo");
    app.save(checkoutSessions);
  }

  const orderItems = app.findCollectionByNameOrId("order_items");
  if (orderItems.fields.getByName("user")) {
    orderItems.fields.removeByName("user");
  }
  orderItems.listRule = "";
  orderItems.viewRule = "";
  app.save(orderItems);

  const userOrders = app.findCollectionByNameOrId("user_orders");
  userOrders.listRule = "";
  userOrders.viewRule = "";
  app.save(userOrders);
});
