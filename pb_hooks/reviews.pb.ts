/// <reference path="../pb_data/types.d.ts" />

routerAdd(
  "GET",
  "/review/{id}",
  (e) => {
    const userId = e.auth?.id;
    const product_id = e.request?.pathValue("id");
    try {
      const review = e.app.findFirstRecordByFilter(
        "reviews",
        "user = {:user} && product = {:product}",
        { user: userId, product: product_id },
      );
      return e.json(200, { data: review, message: "user reviewed" });
    } catch (err) {
      return e.json(200, { data: null, message: "user not reviewed" });
    }
  },
  $apis.requireAuth(),
);

routerAdd(
  "POST",
  "/review",
  (e) => {
    const userId = e.auth?.id;
    const { product, review_message, review_stars } = e.requestInfo().body;

    if (!product || !review_message || review_stars == null) {
      return e.json(400, {
        message: "product, review_message and review_stars are required",
      });
    }

    try {
      e.app.findFirstRecordByFilter(
        "reviews",
        "user = {:user} && product = {:product}",
        { user: userId, product },
      );
      return e.json(400, { message: "already reviewed" });
    } catch (_) {}

    const reviews_col = e.app.findCollectionByNameOrId("reviews");
    const review = new Record(reviews_col);
    review.set("user", userId);
    review.set("product", product);
    review.set("review_message", review_message);
    review.set("review_stars", review_stars);
    e.app.save(review);

    return e.json(200, { data: review, message: "review created" });
  },
  $apis.requireAuth(),
);

routerAdd(
  "PATCH",
  "/review/{id}",
  (e) => {
    const userId = e.auth?.id;
    const review_id = e.request?.pathValue("id");
    const body = e.requestInfo().body;

    const review = e.app.findRecordById("reviews", review_id);
    if (review.getString("user") !== userId) {
      return e.json(403, { message: "not authorized" });
    }

    if (body.review_message != null) review.set("review_message", body.review_message);
    if (body.review_stars != null) review.set("review_stars", body.review_stars);
    e.app.save(review);

    return e.json(200, { data: review, message: "review updated" });
  },
  $apis.requireAuth(),
);

routerAdd(
  "DELETE",
  "/review/{id}",
  (e) => {
    const userId = e.auth?.id;
    const review_id = e.request?.pathValue("id");

    const review = e.app.findRecordById("reviews", review_id);
    if (review.getString("user") !== userId) {
      return e.json(403, { message: "not authorized" });
    }

    //@ts-ignore
    e.app.delete(review);

    return e.json(200, { data: null, message: "review deleted" });
  },
  $apis.requireAuth(),
);
