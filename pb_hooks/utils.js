module.exports = {
  paystack_secret: () => {
    const sec = $os.getenv("PAYSTACK_SECRET");
    if (!sec) {
      throw new Error("PAYSTACK_SECRET environment variable is missing");
    }
    return sec;
  },

  to_kobo: (nairaAmount) => {
    return Math.round((nairaAmount || 0) * 100);
  },

  build_cart_items: (app, all_cart) => {
    let cart_total_kobo = 0;
    let total_quantity = 0;
    const cartItems = [];

    for (const item of all_cart) {
      const product_id = item?.getString("product") ?? "";
      const product = app.findRecordById("products", product_id);
      if (!product || !product.getBool("published")) {
        throw new Error("Product " + product_id + " is not published or unavailable");
      }

      const item_amount = item?.getInt("amount") ?? 0;
      const wristSize = item.getFloat("wristSize") ?? 0;
      const headSize = item.getFloat("headSize") ?? 0;
      const extraInfo = item.getString("extraInfo") ?? "";

      const price_float = product.getFloat("price") ?? 0;
      const unit_price_kobo = Math.round(price_float * 100);
      const line_total_kobo = unit_price_kobo * item_amount;
      const item_naira = line_total_kobo / 100;

      cartItems.push({
        id: item?.id,
        amount: item_amount,
        price: item_naira,
        unit_price_kobo,
        line_total_kobo,
        product_details: product,
        wristSize,
        headSize,
        extraInfo,
      });

      cart_total_kobo += line_total_kobo;
      total_quantity += item_amount;
    }

    return {
      cartItems,
      cart_total: cart_total_kobo / 100,
      cart_total_kobo,
      total_quantity,
    };
  },

  paystack_initialize: (secret, { email, amount, reference }) => {
    const res = $http.send({
      method: "POST",
      url: "https://api.paystack.co/transaction/initialize",
      headers: {
        Authorization: "Bearer " + secret,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, amount: Math.round(amount), reference }),
    });
    if (res.statusCode !== 200) {
      throw new Error("Paystack error: " + res.raw);
    }
    return JSON.parse(res.raw);
  },

  paystack_verify: (secret, reference) => {
    const res = $http.send({
      method: "GET",
      url: "https://api.paystack.co/transaction/verify/" + encodeURIComponent(reference),
      headers: {
        Authorization: "Bearer " + secret,
      },
    });
    if (res.statusCode !== 200) {
      throw new Error("Paystack verify error: " + res.raw);
    }
    return JSON.parse(res.raw);
  },

  fulfill_order: (app, session, reference) => {
    if (!session) return;
    if (session.getString("status") === "fulfilled") {
      return { status: "already_fulfilled" };
    }

    app.runInTransaction((txApp) => {
      const txSession = txApp.findRecordById("checkout_sessions", session.id);
      if (txSession.getString("status") === "fulfilled") {
        return;
      }

      const userId = txSession.getString("user");
      const rawItems = txSession.getString("cart_items");
      let paidSnapshot = [];
      if (rawItems) {
        paidSnapshot = JSON.parse(rawItems);
      }

      const orderItemsCol = txApp.findCollectionByNameOrId("order_items");
      const orderItemIds = [];
      let totalKobo = 0;

      for (const item of paidSnapshot) {
        const productId = item.product_details?.id || item.originalProduct || item.product;
        const amount = item.amount || 1;
        const lineTotalKobo =
          item.line_total_kobo ??
          Math.round((item.price ?? item.product_details?.price ?? 0) * 100 * amount);

        const orderItem = new Record(orderItemsCol);
        orderItem.set("originalProduct", productId);
        orderItem.set("amount", amount);
        orderItem.set("price", lineTotalKobo / 100);
        orderItem.set("ref", reference);
        orderItem.set("extraInfo", item.extraInfo || "");
        if (userId) {
          orderItem.set("user", userId);
        }
        txApp.save(orderItem);

        orderItemIds.push(orderItem.id);
        totalKobo += lineTotalKobo;

        if (item.id) {
          try {
            const cartRecord = txApp.findRecordById("cart", item.id);
            txApp.delete(cartRecord);
          } catch (_) {
            // item may already be removed
          }
        }
      }

      const userOrdersCol = txApp.findCollectionByNameOrId("user_orders");
      const userOrder = new Record(userOrdersCol);
      userOrder.set("ref", reference);
      userOrder.set("orderItems", orderItemIds);
      userOrder.set("preview", orderItemIds[0] || null);
      userOrder.set("status", "pending");
      userOrder.set("user", userId);
      userOrder.set("totalPrice", totalKobo / 100);
      txApp.save(userOrder);

      txSession.set("status", "fulfilled");
      txSession.set("access_code", "");
      txSession.set("hash", "");
      txSession.set("session", "");
      txSession.set("cart_items", "");
      txApp.save(txSession);
    });

    return { status: "fulfilled" };
  },
};
