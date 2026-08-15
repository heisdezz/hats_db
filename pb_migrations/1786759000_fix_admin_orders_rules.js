/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const userOrders = app.findCollectionByNameOrId("pbc_1888273831");
  unmarshal({
    "listRule": "(@request.auth.id != '' && user = @request.auth.id) || @request.auth.collectionName = \"admins\"",
    "viewRule": "(@request.auth.id != '' && user = @request.auth.id) || @request.auth.collectionName = \"admins\"",
    "createRule": "@request.auth.collectionName = \"admins\"",
    "updateRule": "@request.auth.collectionName = \"admins\"",
    "deleteRule": "@request.auth.collectionName = \"admins\""
  }, userOrders);
  app.save(userOrders);

  const orderItems = app.findCollectionByNameOrId("pbc_2456927940");
  unmarshal({
    "listRule": "(@request.auth.id != '' && user = @request.auth.id) || @request.auth.collectionName = \"admins\"",
    "viewRule": "(@request.auth.id != '' && user = @request.auth.id) || @request.auth.collectionName = \"admins\"",
    "createRule": "@request.auth.collectionName = \"admins\"",
    "updateRule": "@request.auth.collectionName = \"admins\"",
    "deleteRule": "@request.auth.collectionName = \"admins\""
  }, orderItems);
  app.save(orderItems);
}, (app) => {
  const userOrders = app.findCollectionByNameOrId("pbc_1888273831");
  unmarshal({
    "listRule": "@request.auth.id != '' && user = @request.auth.id",
    "viewRule": "@request.auth.id != '' && user = @request.auth.id"
  }, userOrders);
  app.save(userOrders);

  const orderItems = app.findCollectionByNameOrId("pbc_2456927940");
  unmarshal({
    "listRule": "@request.auth.id != '' && user = @request.auth.id",
    "viewRule": "@request.auth.id != '' && user = @request.auth.id"
  }, orderItems);
  app.save(orderItems);
});
