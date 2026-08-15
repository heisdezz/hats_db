/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1888273831")

  // update collection data
  unmarshal({
    "viewRule": "(@request.auth.id != '' && user = @request.auth.id ) || @request.auth.collectionName = \"admins\""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1888273831")

  // update collection data
  unmarshal({
    "viewRule": "@request.auth.id != '' && user = @request.auth.id"
  }, collection)

  return app.save(collection)
})
