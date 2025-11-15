import Razorpay from "razorpay";

export default async function handler(req, res) {
  
  // 🔵 1) GET Route (Test API)
  if (req.method === "GET") {
    return res.status(200).json({
      success: true,
      message: "Backend API is running successfully!",
      time: new Date().toISOString(),
    });
  }

  // 🔵 2) Allow only POST for order creation
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { amount } = req.body;

  if (!amount) {
    return res.status(400).json({ error: "Amount is required" });
  }

  // Razorpay Instance (LIVE KEYS from Vercel ENV)
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET,
  });

  try {
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: "receipt_" + Date.now(),
      payment_capture: 1,  // ✔ Auto Capture ON
    });

    return res.status(200).json(order);

  } catch (err) {
    return res.status(500).json({ error: err });
  }
}
