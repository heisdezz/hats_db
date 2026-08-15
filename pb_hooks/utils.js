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

  calculate_distance_km: (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  },

  calculate_delivery_fee: (app, userId, cartTotal = 0) => {
    const RATE_PER_KM = 185;
    const MINIMUM_FEE = 1000;
    const FREE_SHIPPING_THRESHOLD = 150000;

    let shopLat = 6.534864;
    let shopLon = 3.379378;

    try {
      const shopRecord = app.findFirstRecordByFilter("shop_location", "1 = 1");
      if (shopRecord) {
        const rawLoc = shopRecord.getString("location");
        if (rawLoc) {
          try {
            const parsedLoc = JSON.parse(rawLoc);
            if (parsedLoc.lat && parsedLoc.lon) {
              shopLat = Number(parsedLoc.lat);
              shopLon = Number(parsedLoc.lon);
            }
          } catch (_) {}
        }
      }
    } catch (_) {}

    let userLat = null;
    let userLon = null;
    let state = "";
    let fullAddress = "";

    try {
      const deliveryRecord = app.findFirstRecordByData("deliverySettings", "user", userId);
      if (deliveryRecord) {
        state = deliveryRecord.getString("state") || "";
        fullAddress = deliveryRecord.getString("fullAddress") || "";
        const rawLoc = deliveryRecord.getString("location");
        if (rawLoc) {
          try {
            const parsedLoc = JSON.parse(rawLoc);
            if (parsedLoc.lat && parsedLoc.lon) {
              userLat = Number(parsedLoc.lat);
              userLon = Number(parsedLoc.lon);
            }
          } catch (_) {}
        }
      }
    } catch (_) {}

    // Check Lagos free shipping for orders >= 150,000
    const isLagos =
      state.toLowerCase().includes("lagos") ||
      fullAddress.toLowerCase().includes("lagos");

    if (isLagos && cartTotal >= FREE_SHIPPING_THRESHOLD) {
      return {
        deliveryFee: 0,
        distanceKm: 0,
        ratePerKm: RATE_PER_KM,
        minimumFee: MINIMUM_FEE,
        isFreeShipping: true,
      };
    }

    if (!userLat || !userLon) {
      return {
        deliveryFee: MINIMUM_FEE,
        distanceKm: 0,
        ratePerKm: RATE_PER_KM,
        minimumFee: MINIMUM_FEE,
        isFreeShipping: false,
      };
    }

    const distanceKm = module.exports.calculate_distance_km(shopLat, shopLon, userLat, userLon);
    const calculatedFee = Math.round(distanceKm * RATE_PER_KM);
    const deliveryFee = Math.max(MINIMUM_FEE, calculatedFee);

    return {
      deliveryFee,
      distanceKm,
      ratePerKm: RATE_PER_KM,
      minimumFee: MINIMUM_FEE,
      isFreeShipping: false,
    };
  },

  is_hat_product: (app, product) => {
    if (!product) return true;
    const catId = product.getString("category");
    if (!catId) return true;
    try {
      const cat = app.findRecordById("category", catId);
      if (cat) {
        const parent = cat.getString("parent");
        if (parent === "2b96qjthpp27avs") return true;
        try {
          const sec = app.findRecordById("section", parent);
          if (sec && sec.getString("name")?.toLowerCase().includes("hat")) return true;
          if (sec && (sec.getString("name")?.toLowerCase().includes("jewel") || sec.getString("name")?.toLowerCase().includes("accessories"))) return false;
        } catch (_) {}
        const name = (cat.getString("name") || "").toLowerCase();
        if (name.includes("hat") || name.includes("facinator") || name.includes("fascinator") || name.includes("beret") || name.includes("millinery")) {
          return true;
        }
        if (name.includes("jewel") || name.includes("neck") || name.includes("ear") || name.includes("ring") || name.includes("bracelet") || name.includes("anklet") || name.includes("coral")) {
          return false;
        }
      }
    } catch (_) {}
    return true;
  },

  check_cart_space_limit: (app, e) => {
    const MAX_CART_SPACE = 20;
    const userId = e.auth?.id;
    if (!userId) return;

    e.record?.set("user", userId);

    const targetProductId = e.record?.getString("product");
    const targetAmount = e.record?.getInt("amount") || 1;
    const currentRecordId = e.record?.id || "";

    let targetProductSpace = 1;
    if (targetProductId) {
      try {
        const prod = app.findRecordById("products", targetProductId);
        targetProductSpace = prod.getInt("cart_space") || 1;
      } catch (_) {}
    }
    const newItemSpace = targetProductSpace * targetAmount;

    let totalSpace = newItemSpace;
    const otherItems = app.findAllRecords(
      "cart",
      $dbx.exp("user = {:user} AND id != {:id}", {
        user: userId,
        id: currentRecordId,
      }),
    );

    for (const item of otherItems) {
      const prodId = item.getString("product");
      const amt = item.getInt("amount") || 1;
      let pSpace = 1;
      try {
        const p = app.findRecordById("products", prodId);
        pSpace = p.getInt("cart_space") || 1;
      } catch (_) {}
      totalSpace += pSpace * amt;
    }

    if (totalSpace > MAX_CART_SPACE) {
      throw new BadRequestError(
        "Cart space limit exceeded (" + totalSpace + "/" + MAX_CART_SPACE + " space units). For large event or wedding orders, please contact our bespoke team directly.",
      );
    }
  },

  build_cart_items: (app, all_cart) => {
    let cart_total_kobo = 0;
    let total_quantity = 0;
    let total_cart_space = 0;
    let hat_count = 0;
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

      const product_cart_space = product.getInt("cart_space") || 1;
      const item_total_space = product_cart_space * item_amount;
      total_cart_space += item_total_space;

      const is_hat = module.exports.is_hat_product(app, product);
      if (is_hat) {
        hat_count += item_amount;
      }

      cartItems.push({
        id: item?.id,
        amount: item_amount,
        price: item_naira,
        unit_price_kobo,
        line_total_kobo,
        product_details: product,
        cart_space: product_cart_space,
        item_total_space,
        is_hat,
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
      total_cart_space,
      hat_count,
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
      let totalOrderCartSpace = 0;

      for (const item of paidSnapshot) {
        const productId = item.product_details?.id || item.originalProduct || item.product;
        const amount = item.amount || 1;
        const lineTotalKobo =
          item.line_total_kobo ??
          Math.round((item.price ?? item.product_details?.price ?? 0) * 100 * amount);
        const itemCartSpace = item.cart_space || 1;
        totalOrderCartSpace += itemCartSpace * amount;

        const orderItem = new Record(orderItemsCol);
        orderItem.set("originalProduct", productId);
        orderItem.set("amount", amount);
        orderItem.set("price", lineTotalKobo / 100);
        orderItem.set("ref", reference);
        orderItem.set("extraInfo", item.extraInfo || "");
        orderItem.set("cart_space", itemCartSpace);
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
      userOrder.set("total_cart_space", totalOrderCartSpace);
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
