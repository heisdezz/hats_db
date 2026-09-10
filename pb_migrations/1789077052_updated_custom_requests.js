/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4028357799")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id = user.id",
    "deleteRule": "@request.auth.id = user.id || (@request.auth.collectionName = \"admins\")",
    "listRule": "@request.auth.id = user.id || (@request.auth.collectionName = \"admins\")",
    "updateRule": "@request.auth.id = user.id || (@request.auth.collectionName = \"admins\")",
    "viewRule": "@request.auth.id = user.id || (@request.auth.collectionName = \"admins\")"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4028357799")

  // update collection data
  unmarshal({
    "createRule": null,
    "deleteRule": null,
    "listRule": null,
    "updateRule": null,
    "viewRule": null
  }, collection)

  return app.save(collection)
})
