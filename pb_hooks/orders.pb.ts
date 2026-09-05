/// <reference path="../pb_data/types.d.ts" />

onRecordUpdateRequest((e) => {
  const utils = require(`${__hooks}/utils.js`);
  utils.validateOrderStatusAndLogistics(e);
  e.next();
}, "user_orders");

onRecordCreateRequest((e) => {
  const utils = require(`${__hooks}/utils.js`);
  utils.validateOrderStatusAndLogistics(e);
  e.next();
}, "user_orders");
