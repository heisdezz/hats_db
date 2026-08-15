/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4092854851")

  // add field
  collection.fields.addAt(11, new Field({
    "help": "color selection if true allows user to select color else user cant select colors",
    "hidden": false,
    "id": "bool246131184",
    "name": "color_selection",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4092854851")

  // remove field
  collection.fields.removeById("bool246131184")

  return app.save(collection)
})
