// /api/testSendToken.js

export default function handler(req, res) {
  try {
    return res.status(200).json({
      status: "success",
      message: "Vercel API 정상 동작 중!",
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: err.message
    });
  }
}
