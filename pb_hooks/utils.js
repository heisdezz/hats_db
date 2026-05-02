module.exports = {
  secret: "sk_test_726fc22034206178e4c86ec76076893ae1a7764a",

  calculate_delivery_fee: (shop_location, user_location) => {
    const price_per_km = 130;
    const { longitude: shop_lon, latitude: shop_lat } = shop_location;
    const { longitude: user_lon, latitude: user_lat } = user_location;
    console.log("shop_location", JSON.stringify(shop_location));
    console.log("user_location", JSON.stringify(user_location));
    const R = 6371;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(user_lat - shop_lat);
    const dLon = toRad(user_lon - shop_lon);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(shop_lat)) *
        Math.cos(toRad(user_lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    console.log("distance", distance);
    return Math.ceil(distance * price_per_km);
  },

  get_delivery_fee: (app, delivery_record) => {
    const utils = module.exports;
    const shop = app.findRecordById("shop_location", "1");
    const shop_loc = shop.get("location");
    const user_loc = delivery_record.get("location");
    return utils.calculate_delivery_fee(
      { latitude: shop_loc.lat, longitude: shop_loc.lon },
      { latitude: user_loc.lat, longitude: user_loc.lon },
    );
  },

  build_cart_items: (app, all_cart) => {
    let cart_total = 0;
    const cartItems = [];
    for (const item of all_cart) {
      const product_id = item?.getString("product") ?? "";
      const product = app.findRecordById("products", product_id);
      const item_amount = item?.getInt("amount") ?? 0;
      const item_total_price = product.getFloat("price") * item_amount;
      cartItems.push({
        id: item?.id,
        amount: item_amount,
        price: item_total_price,
        product_details: product,
      });
      cart_total += item_total_price;
    }
    return { cartItems, cart_total };
  },

  paystack_initialize: (secret, { email, amount, reference }) => {
    const res = $http.send({
      method: "POST",
      url: "https://api.paystack.co/transaction/initialize",
      headers: {
        Authorization: "Bearer " + secret,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, amount, reference }),
    });
    if (res.statusCode !== 200) {
      throw new Error("Paystack error: " + res.raw);
    }
    return JSON.parse(res.raw);
  },
};
