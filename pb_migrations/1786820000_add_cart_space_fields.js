/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const products = app.findCollectionByNameOrId("products");
  products.fields.add(new Field({
    "hidden": false,
    "name": "cart_space",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number",
    "min": 0
  }));
  app.save(products);

  const orderItems = app.findCollectionByNameOrId("order_items");
  orderItems.fields.add(new Field({
    "hidden": false,
    "name": "cart_space",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number",
    "min": 0
  }));
  app.save(orderItems);

  const userOrders = app.findCollectionByNameOrId("user_orders");
  userOrders.fields.add(new Field({
    "hidden": false,
    "name": "total_cart_space",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number",
    "min": 0
  }));
  app.save(userOrders);
}, (app) => {
  const products = app.findCollectionByNameOrId("products");
  const pField = products.fields.getByName("cart_space");
  if (pField) {
    products.fields.removeById(pField.id);
    app.save(products);
  }

  const orderItems = app.findCollectionByNameOrId("order_items");
  const oiField = orderItems.fields.getByName("cart_space");
  if (oiField) {
    orderItems.fields.removeById(oiField.id);
    app.save(orderItems);
  }

  const userOrders = app.findCollectionByNameOrId("user_orders");
  const uoField = userOrders.fields.getByName("total_cart_space");
  if (uoField) {
    userOrders.fields.removeById(uoField.id);
    app.save(userOrders);
  }
});
