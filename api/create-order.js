import crypto from "crypto";

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Preflight
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  // Body parse
  let body = req.body;
  if (!body) return res.status(400).json({ error: "Empty Body" });

  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: "Invalid JSON" });
    }
  }

  const action = body.action;

  // ------------------------------
  // 1️⃣ CREATE ORDER
  // ------------------------------
  if (action === "create_order") {
    const { amount } = body;

    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: "Amount Missing OR Invalid" });
    }

    try {
      const Razorpay = (await import("razorpay")).default;

      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_SECRET) {
        return res.status(500).json({ error: "Razorpay Keys Missing in Server" });
      }

      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_SECRET,
      });

      const order = await razorpay.orders.create({
        amount: Number(amount) * 100,
        currency: "INR",
        receipt: "rcpt_" + Date.now(),
      });

      return res.status(200).json({
        success: true,
        order,
      });

    } catch (err) {
      return res.status(500).json({
        error: "Order Creation Failed",
        details: err.message,
      });
    }
  }

  // ------------------------------
  // 2️⃣ VERIFY PAYMENT SIGNATURE
  // ------------------------------
  if (action === "verify_payment") {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        error: "Missing required fields for verification",
      });
    }

    const secret = process.env.RAZORPAY_SECRET;
    if (!secret) {
      return res.status(500).json({ error: "Secret key missing" });
    }

    try {
      const shasum = crypto.createHmac("sha256", secret);
      shasum.update(razorpay_order_id + "|" + razorpay_payment_id);
      const digest = shasum.digest("hex");

      if (digest === razorpay_signature) {
        return res.status(200).json({
          success: true,
          verified: true,
          message: "Payment signature verified",
        });
      } else {
        return res.status(400).json({
          success: false,
          verified: false,
          error: "Signature mismatch",
        });
      }

    } catch (err) {
      return res.status(500).json({
        error: "Verification Error",
        details: err.message,
      });
    }
  }

  // If no action matched
  return res.status(400).json({ error: "Invalid action" });
}
