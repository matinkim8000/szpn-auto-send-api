export default function handler(req, res) {
  return res.status(200).json({
    status: "success",
    message: "Vercel API 정상 작동!",
    time: new Date().toISOString()
  });
}
