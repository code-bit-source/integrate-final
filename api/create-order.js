export default async function handler(req, res) {
  // ⭐ GLOBAL CORS FIX
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // ⭐ Preflight request (MUST be on top)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // ⭐ Allow only POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  // ⭐ BODY PARSING FIX (Vercel issue)
  let body = req.body;

  if (!body || body === "") {
    return res.status(400).json({ error: "Empty Body" });
  }

  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (err) {
      return res.status(400).json({ error: "Invalid JSON Format" });
    }
  }

  const { amount } = body;

  // ⭐ Validation Fix
  if (!amount || isNaN(amount)) {
    return res.status(400).json({ error: "Amount Missing or Invalid" });
  }

  try {
    // ⭐ Correct Razorpay Import for Vercel Serverless
    const Razorpay = (await import("razorpay")).default;

    // ⭐ ENV CHECK (Important)
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_SECRET) {
      return res.status(500).json({ error: "Razorpay Keys Missing in Server" });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET,
    });

    // ⭐ CREATE ORDER
    const order = await razorpay.orders.create({
      amount: Number(amount) * 100, // convert Rs → paise
      currency: "INR",
      receipt: "rcpt_" + Date.now(),
    });

    // ⭐ RETURN ORDER
    return res.status(200).json({
      success: true,
      order,
    });

  } catch (error) {
    console.error("ORDER ERROR:", error);
    return res.status(500).json({
      error: "Order Creation Failed",
      details: error.message,
    });
  }
}
