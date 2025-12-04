// api/ping.js
module.exports = async function handler(req, res) {
  try {
    return res.status(200).json({
      status: "OK",
      method: req.method,
      body: req.body || null,
      note: "ping-ok"
    });
  } catch (err) {
    return res.status(500).json({
      status: "ERROR",
      error: String(err)
    });
  }
};
