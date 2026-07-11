/**
 * server.js — DigiSociety Backend API
 *
 * Start:  node server.js          (production)
 *         npx nodemon server.js   (development with auto-restart)
 *
 * The server waits for the SQLite database to initialise, then
 * auto-seeds the admin account if it doesn't exist yet.
 */

require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const bcrypt  = require("bcryptjs");

const db          = require("./db/database");
const authRoutes  = require("./routes/auth");
const adminRoutes = require("./routes/admin");

const app  = express();
const PORT = process.env.PORT || 4000;

// ─── Middleware ────────────────────────────────────────────────────────────

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:4173",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:4173",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Basic request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────

app.use("/api/auth",  authRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "DigiSociety API is running.", timestamp: new Date().toISOString() });
});

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error("[Unhandled error]", err);
  res.status(500).json({ success: false, message: "Internal server error." });
});

// ─── Boot sequence ────────────────────────────────────────────────────────

(async () => {
  // 1. Wait for the database to initialise
  await db.readyPromise;
  console.log("✅  Database ready.");

  // 2. Auto-seed the admin user if not present
  const ADMIN_EMAIL    = "digisociety.in@gmail.com";
  const ADMIN_PASSWORD = "digisociety";

  const existing = db.get(
    "SELECT id FROM users WHERE LOWER(email) = LOWER(?)",
    [ADMIN_EMAIL]
  );

  if (!existing) {
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    db.run(
      `INSERT INTO users (email, password, full_name, role, is_active)
       VALUES (?, ?, 'Vedant Kirtane', 'admin', 1)`,
      [ADMIN_EMAIL.toLowerCase(), hash]
    );
    console.log(`✅  Admin user seeded → ${ADMIN_EMAIL}`);
  } else {
    console.log(`ℹ️   Admin user already exists (id=${existing.id}).`);
  }

  // 3. Start listening
  app.listen(PORT, () => {
    console.log("\n╔══════════════════════════════════════════╗");
    console.log("║   DigiSociety Backend API  🏢             ║");
    console.log(`║   Running on http://localhost:${PORT}       ║`);
    console.log("╚══════════════════════════════════════════╝");
    console.log("\n  Endpoints:");
    console.log("  POST  /api/auth/login");
    console.log("  GET   /api/auth/me");
    console.log("  POST  /api/auth/logout");
    console.log("  POST  /api/auth/forgot-password");
    console.log("  GET   /api/admin/dashboard");
    console.log("  GET   /api/admin/users");
    console.log("  GET   /api/admin/login-logs");
    console.log("  GET   /api/health\n");
  });
})();
