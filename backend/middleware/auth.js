/**
 * auth.js  –  JWT verification middleware
 *
 * Protects routes that require a valid session.
 * Attach it to any router:  router.use(requireAuth)
 */

const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "digisociety_super_secret_jwt_key_2026";

/**
 * requireAuth
 * Reads the Bearer token from the Authorization header,
 * verifies it, and attaches `req.user` for downstream handlers.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "No token provided. Please log in." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { id, email, role, iat, exp }
    next();
  } catch (err) {
    const message =
      err.name === "TokenExpiredError"
        ? "Session expired. Please log in again."
        : "Invalid token. Please log in.";
    return res.status(401).json({ success: false, message });
  }
}

module.exports = { requireAuth };
