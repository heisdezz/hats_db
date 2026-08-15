/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2456927940")

  // update collection data
  unmarshal({
    "listRule": "(@request.auth.id != '' && user = @request.auth.id ) || @request.auth.collectionName = \"admins\"",
    "viewRule": "(@request.auth.id != '' && user = @request.auth.id ) || @request.auth.collectionName = \"admins\""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2456927940")

  // update collection data
  unmarshal({
    "listRule": "@request.auth.id != '' && user = @request.auth.id",
    "viewRule": "@request.auth.id != '' && user = @request.auth.id"
  }, collection)

  return app.save(collection)
})
