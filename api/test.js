export default function handler(req, res) {
  return res.status(200).json({
    success: true,
    message: "Backend API is running successfully!",
    time: new Date().toISOString(),
  });
}
