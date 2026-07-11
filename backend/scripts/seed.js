/**
 * seed.js
 * Creates the default admin user:
 *   email   : kirtane.vedant1@gmail.com
 *   password: Vedu@2004
 *
 * Run once:  node scripts/seed.js
 * Safe to re-run — skips if the user already exists.
 */

const bcrypt = require("bcryptjs");
const db = require("../db/database");

const ADMIN_EMAIL    = "kirtane.vedant1@gmail.com";
const ADMIN_PASSWORD = "Vedu@2004";
const ADMIN_NAME     = "Vedant Kirtane";

(async () => {
  // Wait for the DB to be ready
  await db.readyPromise;

  try {
    const existing = db.get(
      "SELECT id FROM users WHERE LOWER(email) = LOWER(?)",
      [ADMIN_EMAIL]
    );

    if (existing) {
      console.log(`✅  Admin user already exists (id=${existing.id}). Skipping seed.`);
      process.exit(0);
    }

    const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);

    const result = db.run(
      `INSERT INTO users (email, password, full_name, role, is_active)
       VALUES (?, ?, ?, 'admin', 1)`,
      [ADMIN_EMAIL.toLowerCase(), hash, ADMIN_NAME]
    );

    console.log(`✅  Admin user created successfully!`);
    console.log(`    ID       : ${result.lastInsertRowid}`);
    console.log(`    Email    : ${ADMIN_EMAIL}`);
    console.log(`    Password : ${ADMIN_PASSWORD}  (stored as bcrypt hash)`);
    console.log(`    Role     : admin`);
  } catch (err) {
    console.error("❌  Seed failed:", err.message);
    process.exit(1);
  }
})();
