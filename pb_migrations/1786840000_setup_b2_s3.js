/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const settings = app.settings();

  settings.s3.enabled = true;
  settings.s3.bucket = "hats-db";
  settings.s3.region = "us-east-005";
  settings.s3.endpoint = "https://s3.us-east-005.backblazeb2.com";
  settings.s3.accessKey = "005133478d51e460000000007";
  settings.s3.secret = "K005N9SkqLsGLswyc1YfKtWO2lnYX/U";
  settings.s3.forcePathStyle = true;

  return app.save(settings);
}, (app) => {
  const settings = app.settings();
  settings.s3.enabled = false;
  return app.save(settings);
});
