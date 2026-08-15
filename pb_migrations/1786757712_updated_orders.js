/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_221558369")

  // update collection data
  unmarshal({
    "listRule": "@request.auth.id != \"\" && @request.auth.collectionName = \"admins\"",
    "viewRule": "@request.auth.id != \"\" && @request.auth.collectionName = \"admins\""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_221558369")

  // update collection data
  unmarshal({
    "listRule": "@request.auth.collectionName = \"admins\"",
    "viewRule": "@request.auth.collectionName = \"admins\""
  }, collection)

  return app.save(collection)
})
