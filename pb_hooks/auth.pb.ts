/// <reference path="../pb_data/types.d.ts" />

// onRecordCreate((e) => {
//   const id = e.record?.id;
//   const delivery_collection = e.app.findCollectionByNameOrId("deliverySettins");
//   const profile_collection = e.app.findCollectionByNameOrId("users");
//   const profile_record = new Record(profile_collection);

//   const data = e.record.get()

//   // const new_record = new Record(delivery_collection);

//   // e.app.save(new_record);
// }, "users");

routerAdd("POST", "/register", (e) => {
  const data = new DynamicModel({
    email: "",
    username: "",
    password: "",
    passwordConfirm: "",
    firstName: "",
    lastName: "",
    sex: "unspecified",
    age: 18,
    phoneNumber: "",
  });
  e.bindBody(data);

  const users_collection = e.app.findCollectionByNameOrId("users");
  const profile_collection = e.app.findCollectionByNameOrId("profile");
  const deliver_collection = e.app.findCollectionByNameOrId("deliverySettings");
  const session_collection =
    e.app.findCollectionByNameOrId("checkout_sessions");

  let saved_user;
  try {
    e.app.runInTransaction((txApp) => {
      const user_record = new Record(users_collection);
      user_record.setPassword(data.password);
      user_record.set("email", data.email);
      user_record.set("username", data.username);
      txApp.save(user_record);
      const profile_record = new Record(profile_collection);
      profile_record.set("user", user_record.id);
      profile_record.set("firstName", data.firstName);
      profile_record.set("lastName", data.lastName);
      profile_record.set("sex", data.sex);
      profile_record.set("phoneNumber", data.phoneNumber);
      profile_record.set("age", data.age);
      profile_record.set("email", data.email);
      txApp.save(profile_record);
      const deliver_record = new Record(deliver_collection);
      deliver_record.set("profile", profile_record.id);
      txApp.save(deliver_record);
      saved_user = user_record;
      const session_record = new Record(session_collection);
      session_record.set("user", user_record.id);
      txApp.save(session_record);
    });

    //@ts-ignore
    return $apis.recordAuthResponse(e, saved_user, "username");
  } catch (error) {
    return e.json(500, {
      status: "error",
      message: String(error),
    });
  }
});

routerAdd(
  "GET",
  "/profile/me",
  (e) => {
    const auth_record = e.auth;
    const id = auth_record?.id;
    console.log("auth_id", id);
    try {
      const user_profile = e.app.findFirstRecordByData("profile", "user", id);
      return e.json(200, user_profile);
    } catch (error) {
      console.error(error);
      return e.json(500, {
        status: "error",
        message: String(error),
      });
    }
  },
  $apis.requireAuth(),
);

routerAdd(
  "GET",
  "/delivery/me/{id}",
  (e) => {
    const auth_record = e.auth;
    let id = e.request?.pathValue("id");
    console.log("delivery_id", id);
    try {
      const user_profile = e.app.findFirstRecordByData(
        "deliverySettings",
        "profile",
        id,
      );
      return e.json(200, user_profile);
    } catch (error) {
      console.error(error);
      return e.json(500, {
        status: "error",
        message: String(error),
      });
    }
  },
  $apis.requireAuth(),
);

routerAdd(
  "POST",
  "/delivery/",
  (e) => {
    try {
      const user_auth = e.auth?.id;
      const user_profile = e.app.findFirstRecordByData(
        "profile",
        "user",
        user_auth,
      );
      const delivery_record = e.app.findFirstRecordByData(
        "deliverySettings",
        "profile",
        user_profile.id,
      );

      const body = new DynamicModel({
        full_address: "",
        city: "",
        state: "",
        location: {
          lon: 0,
          lat: 0,
        },
        profile: user_profile,
      });
      e.bindBody(body);
      delivery_record.set("fullAddress", body.full_address);
      delivery_record.set("city", body.city);
      delivery_record.set("state", body.state);
      delivery_record.set("location", body.location);
      delivery_record.set("user", user_auth);
      e.app.save(delivery_record);
      e.next;
      return e.json(200, user_profile);
    } catch (error) {
      console.error(error);
      return e.json(500, {
        status: "error",
        message: String(error),
      });
    }
  },
  $apis.requireAuth(),
);
