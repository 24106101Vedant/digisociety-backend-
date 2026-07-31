const pool = require("./db");

async function createTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100),
      email VARCHAR(255) UNIQUE NOT NULL,
      mobile VARCHAR(20),
      password VARCHAR(255) NOT NULL,
      role VARCHAR(30) DEFAULT 'member',
      is_active INTEGER DEFAULT 1,
      last_login TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS enquiries (
      id SERIAL PRIMARY KEY,
      society_name VARCHAR(255),
      chairman_name VARCHAR(255),
      email VARCHAR(255),
      mobile VARCHAR(20),
      status VARCHAR(30) DEFAULT 'New',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS login_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      email VARCHAR(255) NOT NULL,
      success INTEGER NOT NULL,
      ip_address VARCHAR(100),
      user_agent TEXT,
      logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log("✅ Tables Created");
}

module.exports = createTables;
