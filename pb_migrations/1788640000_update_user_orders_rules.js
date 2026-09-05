/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("user_orders");
  collection.updateRule = '(@request.auth.id != "" && user = @request.auth.id) || @request.auth.collectionName = "admins"';
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("user_orders");
  collection.updateRule = '@request.auth.collectionName = "admins"';
  return app.save(collection);
});
