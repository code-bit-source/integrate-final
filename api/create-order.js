import Razorpay from "razorpay";

export default async function handler(req, res) {
  // ⭐ CORS FIX
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ⭐ OPTIONS request (preflight)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // ⭐ GET — check API running
  if (req.method === "GET") {
    return res.status(200).json({
      success: true,
      message: "Backend API is running",
      time: new Date().toISOString(),
    });
  }

  // ⭐ Only POST allowed for Razorpay
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { amount } = req.body;

  if (!amount) {
    return res.status(400).json({ error: "Amount is required" });
  }

  // ⭐ Razorpay instance
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET,
  });

  try {
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: "receipt_" + Date.now(),
      payment_capture: 1, // AUTO CAPTURE
    });

    return res.status(200).json(order);

  } catch (err) {
    return res.status(500).json({ error: err });
  }
}
