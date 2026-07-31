/**
 * controllers/authController.js
 *
 * Handles all authentication business logic:
 *   register    – validate, hash password, save to PostgreSQL
 *   login       – find user, compare password, return JWT
 *   getMe       – return current authenticated user
 *   logout      – stateless token drop
 *   forgotPassword – send reset link (placeholder)
 */

const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");
const pool   = require("../config/db");

const JWT_SECRET     = process.env.JWT_SECRET     || "DigisocietySecret123";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

// ─── Helper: log login attempt ────────────────────────────────────────────
async function logAttempt({ userId, email, success, req }) {
  try {
    await pool.query(
      `INSERT INTO login_logs (user_id, email, success, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId || null, email, success ? 1 : 0, req.ip || null, req.headers["user-agent"] || null]
    );
  } catch (_) { /* never let logging break auth */ }
}

// ─── Register ─────────────────────────────────────────────────────────────
async function register(req, res) {
  try {
    const { name, email, mobile, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email, and password are required." });
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ success: false, message: "Invalid email address." });
    }

    // Password length check
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
    }

    // Check if email already registered
    const existing = await pool.query(
      "SELECT id FROM users WHERE LOWER(email) = LOWER($1)",
      [email.trim()]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: "An account with that email already exists." });
    }

    // Hash password and insert user
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, mobile, password)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, mobile, role, created_at`,
      [name.trim(), email.trim().toLowerCase(), mobile?.trim() || null, hash]
    );

    const newUser = result.rows[0];

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      data: newUser,
    });
  } catch (err) {
    console.error("[register] error:", err);
    return res.status(500).json({ success: false, message: "Internal server error. Please try again." });
  }
}

// ─── Login ────────────────────────────────────────────────────────────────
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    // Find user by email
    const result = await pool.query(
      "SELECT * FROM users WHERE LOWER(email) = LOWER($1)",
      [email.trim()]
    );
    const user = result.rows[0];

    if (!user) {
      await logAttempt({ email, success: false, req });
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    if (user.is_active === 0) {
      await logAttempt({ userId: user.id, email, success: false, req });
      return res.status(403).json({ success: false, message: "Your account has been disabled. Please contact support." });
    }

    // Compare password with hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      await logAttempt({ userId: user.id, email, success: false, req });
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    // Update last_login timestamp
    await pool.query(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1",
      [user.id]
    );

    await logAttempt({ userId: user.id, email, success: true, req });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id:     user.id,
        name:   user.name,
        email:  user.email,
        mobile: user.mobile,
        role:   user.role,
      },
    });
  } catch (err) {
    console.error("[login] error:", err);
    return res.status(500).json({ success: false, message: "Internal server error. Please try again." });
  }
}

// ─── Get Current User ─────────────────────────────────────────────────────
async function getMe(req, res) {
  try {
    const result = await pool.query(
      "SELECT id, name, email, mobile, role, is_active, created_at, last_login FROM users WHERE id = $1",
      [req.user.id]
    );
    const user = result.rows[0];
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    return res.json({ success: true, user });
  } catch (err) {
    console.error("[getMe] error:", err);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// ─── Logout ───────────────────────────────────────────────────────────────
function logout(_req, res) {
  // Stateless JWT — client simply discards the token
  return res.json({ success: true, message: "Logged out successfully." });
}

// ─── Forgot Password ──────────────────────────────────────────────────────
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    const result = await pool.query(
      "SELECT id FROM users WHERE LOWER(email) = LOWER($1)",
      [email.trim()]
    );

    if (result.rows.length > 0) {
      // TODO: generate reset token and send email
      console.log(`[forgot-password] Reset requested for: ${email} (id=${result.rows[0].id})`);
    }

    // Always return the same response (prevents email enumeration)
    return res.json({
      success: true,
      message: "If that email is registered, a password reset link has been sent.",
    });
  } catch (err) {
    console.error("[forgotPassword] error:", err);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
}

module.exports = { register, login, getMe, logout, forgotPassword };
