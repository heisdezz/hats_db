/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1888273831")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_8jaliz6y3q` ON `user_orders` (`ref`)",
      "CREATE INDEX `idx_s9o871hps2` ON `user_orders` (`logisitics`)"
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1888273831")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_8jaliz6y3q` ON `user_orders` (`ref`)"
    ]
  }, collection)

  return app.save(collection)
})
