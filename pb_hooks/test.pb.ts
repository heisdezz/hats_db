/// <reference path="../pb_data/types.d.ts" />

routerAdd("GET", "/health", (e) => {
  console.log("health-check");
  return e.json(200, { status: "ok" });
});
