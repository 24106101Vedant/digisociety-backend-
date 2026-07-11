/**
 * routes/admin.js
 *
 * Admin-only routes — all require a valid JWT with role = 'admin'.
 *
 * GET    /api/admin/dashboard      – summary stats
 * GET    /api/admin/users          – list all users
 * GET    /api/admin/users/:id      – get single user
 * POST   /api/admin/users          – create a new user
 * PUT    /api/admin/users/:id      – update user details / password
 * DELETE /api/admin/users/:id      – deactivate (soft-delete) a user
 * GET    /api/admin/login-logs     – recent login attempts
 */

const express = require("express");
const bcrypt  = require("bcryptjs");
const db      = require("../db/database");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required." });
  }
  next();
}
router.use(requireAdmin);

// ─── GET /api/admin/dashboard ─────────────────────────────────────────────
router.get("/dashboard", (req, res) => {
  try {
    const totalUsers   = db.get("SELECT COUNT(*) AS count FROM users").count;
    const activeUsers  = db.get("SELECT COUNT(*) AS count FROM users WHERE is_active = 1").count;
    const totalLogins  = db.get("SELECT COUNT(*) AS count FROM login_logs WHERE success = 1").count;
    const failedLogins = db.get("SELECT COUNT(*) AS count FROM login_logs WHERE success = 0").count;
    const recentLogins = db.all(
      `SELECT logged_at, email, success, ip_address
       FROM login_logs ORDER BY logged_at DESC LIMIT 10`
    );

    return res.json({
      success: true,
      data: { stats: { totalUsers, activeUsers, totalLogins, failedLogins }, recentLogins },
    });
  } catch (err) {
    console.error("[/dashboard] error:", err);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ─── GET /api/admin/users ─────────────────────────────────────────────────
router.get("/users", (_req, res) => {
  try {
    const users = db.all(
      "SELECT id, email, full_name, role, is_active, created_at, last_login FROM users ORDER BY id"
    );
    return res.json({ success: true, data: users });
  } catch (err) {
    console.error("[GET /users] error:", err);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ─── GET /api/admin/users/:id ─────────────────────────────────────────────
router.get("/users/:id", (req, res) => {
  try {
    const user = db.get(
      "SELECT id, email, full_name, role, is_active, created_at, last_login FROM users WHERE id = ?",
      [req.params.id]
    );
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    return res.json({ success: true, data: user });
  } catch (err) {
    console.error("[GET /users/:id] error:", err);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ─── POST /api/admin/users ────────────────────────────────────────────────
router.post("/users", async (req, res) => {
  try {
    const { email, password, full_name, role = "member" } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }
    if (!["admin", "member"].includes(role)) {
      return res.status(400).json({ success: false, message: "Role must be 'admin' or 'member'." });
    }

    const existing = db.get(
      "SELECT id FROM users WHERE LOWER(email) = LOWER(?)",
      [email.trim()]
    );
    if (existing) {
      return res.status(409).json({ success: false, message: "A user with that email already exists." });
    }

    const hash   = await bcrypt.hash(password, 12);
    const result = db.run(
      "INSERT INTO users (email, password, full_name, role) VALUES (?, ?, ?, ?)",
      [email.trim().toLowerCase(), hash, full_name || "", role]
    );

    return res.status(201).json({
      success: true,
      message: "User created successfully.",
      data: { id: result.lastInsertRowid, email, full_name, role },
    });
  } catch (err) {
    console.error("[POST /users] error:", err);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ─── PUT /api/admin/users/:id ─────────────────────────────────────────────
router.put("/users/:id", async (req, res) => {
  try {
    const { full_name, role, is_active, password } = req.body;
    const userId = req.params.id;

    const user = db.get("SELECT id FROM users WHERE id = ?", [userId]);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    const fields = [];
    const values = [];

    if (full_name  !== undefined) { fields.push("full_name = ?");  values.push(full_name); }
    if (role       !== undefined) {
      if (!["admin", "member"].includes(role)) {
        return res.status(400).json({ success: false, message: "Invalid role." });
      }
      fields.push("role = ?"); values.push(role);
    }
    if (is_active  !== undefined) { fields.push("is_active = ?");  values.push(is_active ? 1 : 0); }
    if (password) {
      const hash = await bcrypt.hash(password, 12);
      fields.push("password = ?"); values.push(hash);
    }

    if (!fields.length) {
      return res.status(400).json({ success: false, message: "No fields to update." });
    }

    values.push(userId);
    db.run(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, values);

    return res.json({ success: true, message: "User updated successfully." });
  } catch (err) {
    console.error("[PUT /users/:id] error:", err);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ─── DELETE /api/admin/users/:id (soft-delete) ────────────────────────────
router.delete("/users/:id", (req, res) => {
  try {
    const userId = req.params.id;

    if (String(req.user.id) === String(userId)) {
      return res.status(400).json({ success: false, message: "You cannot deactivate your own account." });
    }

    const user = db.get("SELECT id FROM users WHERE id = ?", [userId]);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    db.run("UPDATE users SET is_active = 0 WHERE id = ?", [userId]);
    return res.json({ success: true, message: "User deactivated successfully." });
  } catch (err) {
    console.error("[DELETE /users/:id] error:", err);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ─── GET /api/admin/login-logs ────────────────────────────────────────────
router.get("/login-logs", (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const logs = db.all(
      `SELECT id, email, success, ip_address, user_agent, logged_at
       FROM login_logs ORDER BY logged_at DESC LIMIT ?`,
      [limit]
    );
    return res.json({ success: true, data: logs });
  } catch (err) {
    console.error("[GET /login-logs] error:", err);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

module.exports = router;
