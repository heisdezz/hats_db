/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1570316057")

  // add field
  collection.fields.addAt(2, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text4277159965",
    "max": 0,
    "min": 0,
    "name": "badge",
    "pattern": "(new|hot|trending)",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1570316057")

  // remove field
  collection.fields.removeById("text4277159965")

  return app.save(collection)
})
