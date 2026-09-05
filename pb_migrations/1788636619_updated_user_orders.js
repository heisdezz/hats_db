/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1888273831")

  // add field
  collection.fields.addAt(10, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3399572465",
    "help": "",
    "hidden": false,
    "id": "relation1385748412",
    "maxSelect": 0,
    "minSelect": 0,
    "name": "logisitics",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(11, new Field({
    "help": "",
    "hidden": false,
    "id": "number1997877400",
    "max": null,
    "min": null,
    "name": "code",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1888273831")

  // remove field
  collection.fields.removeById("relation1385748412")

  // remove field
  collection.fields.removeById("number1997877400")

  return app.save(collection)
})
