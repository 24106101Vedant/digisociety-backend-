/**
 * routes/auth.js
 *
 * POST /api/auth/login           – validate credentials, return JWT
 * GET  /api/auth/me              – return current user (protected)
 * POST /api/auth/logout          – client-side token drop (stateless)
 * POST /api/auth/forgot-password – request a password reset link
 */

const express = require("express");
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const db      = require("../db/database");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const JWT_SECRET     = process.env.JWT_SECRET     || "digisociety_super_secret_jwt_key_2026";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

// ─── Helper: log login attempt ─────────────────────────────────────────────
function logAttempt({ userId, email, success, req }) {
  try {
    db.run(
      `INSERT INTO login_logs (user_id, email, success, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?)`,
      [userId || null, email, success ? 1 : 0, req.ip || null, req.headers["user-agent"] || null]
    );
  } catch (_) { /* never let logging break auth */ }
}

// ─── POST /api/auth/login ──────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    const user = db.get(
      "SELECT * FROM users WHERE LOWER(email) = LOWER(?)",
      [email.trim()]
    );

    if (!user) {
      logAttempt({ email, success: false, req });
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    if (!user.is_active) {
      logAttempt({ userId: user.id, email, success: false, req });
      return res.status(403).json({ success: false, message: "Your account has been disabled. Please contact support." });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      logAttempt({ userId: user.id, email, success: false, req });
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    // Update last_login
    db.run("UPDATE users SET last_login = datetime('now') WHERE id = ?", [user.id]);

    logAttempt({ userId: user.id, email, success: true, req });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id:         user.id,
        email:      user.email,
        full_name:  user.full_name,
        role:       user.role,
        last_login: user.last_login,
      },
    });
  } catch (err) {
    console.error("[/login] error:", err);
    return res.status(500).json({ success: false, message: "Internal server error. Please try again." });
  }
});

// ─── GET /api/auth/me ──────────────────────────────────────────────────────
router.get("/me", requireAuth, (req, res) => {
  try {
    const user = db.get(
      "SELECT id, email, full_name, role, is_active, created_at, last_login FROM users WHERE id = ?",
      [req.user.id]
    );
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    return res.json({ success: true, user });
  } catch (err) {
    console.error("[/me] error:", err);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ─── POST /api/auth/logout ─────────────────────────────────────────────────
router.post("/logout", requireAuth, (_req, res) => {
  return res.json({ success: true, message: "Logged out successfully." });
});

// ─── POST /api/auth/forgot-password ───────────────────────────────────────
router.post("/forgot-password", (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    const user = db.get(
      "SELECT id FROM users WHERE LOWER(email) = LOWER(?)",
      [email.trim()]
    );

    if (user) {
      // Real implementation: generate reset token, email the link.
      console.log(`[forgot-password] Reset requested for: ${email} (id=${user.id})`);
    }

    // Always return the same response (prevents email enumeration)
    return res.json({
      success: true,
      message: "If that email is registered, a password reset link has been sent.",
    });
  } catch (err) {
    console.error("[/forgot-password] error:", err);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

module.exports = router;
