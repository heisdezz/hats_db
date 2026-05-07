module.exports = {
  secret: "sk_test_726fc22034206178e4c86ec76076893ae1a7764a",

  build_cart_items: (app, all_cart) => {
    let cart_total = 0;
    let total_quantity = 0;
    const cartItems = [];
    for (const item of all_cart) {
      const product_id = item?.getString("product") ?? "";
      const product = app.findRecordById("products", product_id);
      const item_amount = item?.getInt("amount") ?? 0;
      const wristSize = item.getFloat("wristSize") ?? 0;
      const headSize = item.getFloat("headSize") ?? 0;
      const item_total_price = product.getFloat("price") * item_amount;
      cartItems.push({
        id: item?.id,
        amount: item_amount,
        price: item_total_price,
        product_details: product,
        wristSize,
        headSize,
      });
      cart_total += item_total_price;
      total_quantity += item_amount;
    }
    return { cartItems, cart_total, total_quantity };
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
