export default async function handler(req, res) {
  // ⭐ GLOBAL CORS FIX
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // ⭐ Preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // ⭐ Test GET route
  if (req.method === "GET") {
    return res.status(200).json({
      success: true,
      message: "Backend API is running",
      time: new Date().toISOString(),
    });
  }

  // ⭐ Allow only POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  // ⭐ BODY PARSING FIX (Vercel issue)
  let bodyData = req.body;
  if (typeof bodyData === "string") {
    try {
      bodyData = JSON.parse(bodyData);
    } catch {
      return res.status(400).json({ error: "Invalid JSON Body" });
    }
  }

  const { amount } = bodyData;

  if (!amount) {
    return res.status(400).json({ error: "Amount Missing" });
  }

  try {
    // ⭐ Correct Razorpay Import (Vercel Serverless Required)
    const Razorpay = (await import("razorpay")).default;

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET,
    });

    // ⭐ CREATE ORDER
    const order = await razorpay.orders.create({
      amount: amount * 100, // convert Rs → paise
      currency: "INR",
      receipt: "rcpt_" + Date.now(),
      payment_capture: 1, // AUTO CAPTURE ON
    });

    return res.status(200).json(order);

  } catch (error) {
    console.error("ORDER ERROR:", error); // log in vercel
    return res.status(500).json({
      error: "Order Creation Failed",
      details: error.message,
    });
  }
}
