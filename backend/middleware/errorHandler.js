// backend/middleware/errorHandler.js
function errorHandler(err, req, res, next) {
  console.error("❌ Error:", err.message);
  res.status(500).json({ error: err.message || "Server Error" });
}

module.exports = errorHandler;
