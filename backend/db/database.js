/**
 * database.js
 * Opens (or creates) a SQLite database using sql.js (pure JavaScript —
 * no native compilation required).
 *
 * The DB is loaded from disk on startup and saved back after every write.
 */

const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const DB_PATH = process.env.DB_PATH || "./data/digisociety.db";
const resolvedPath = path.resolve(__dirname, "..", DB_PATH);

// Ensure the data directory exists
const dir = path.dirname(resolvedPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// sql.js is loaded synchronously via require; initSqlJs returns a Promise
// so we bootstrap asynchronously but expose a ready promise the rest of the
// app waits on.

let _db = null; // the sql.js Database instance

const readyPromise = (async () => {
  const initSqlJs = require("sql.js");
  const SQL = await initSqlJs();

  if (fs.existsSync(resolvedPath)) {
    const fileBuffer = fs.readFileSync(resolvedPath);
    _db = new SQL.Database(fileBuffer);
  } else {
    _db = new SQL.Database();
  }

  // Initialise schema
  _db.run(`PRAGMA foreign_keys = ON;`);
  _db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      email       TEXT    NOT NULL UNIQUE,
      password    TEXT    NOT NULL,
      full_name   TEXT    NOT NULL DEFAULT '',
      role        TEXT    NOT NULL DEFAULT 'admin',
      is_active   INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      last_login  TEXT
    );
  `);
  _db.run(`
    CREATE TABLE IF NOT EXISTS login_logs (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER,
      email       TEXT    NOT NULL,
      success     INTEGER NOT NULL,
      ip_address  TEXT,
      user_agent  TEXT,
      logged_at   TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  persist(); // write initial (possibly empty) DB to disk
  return _db;
})();

/** Save the in-memory DB back to disk */
function persist() {
  if (!_db) return;
  const data = _db.export();
  fs.writeFileSync(resolvedPath, Buffer.from(data));
}

// ─── Thin synchronous-style wrapper so routes look the same ───────────────

/**
 * Execute a statement that returns no rows (INSERT / UPDATE / DELETE / CREATE).
 * Returns { changes, lastInsertRowid }
 */
function run(sql, params = []) {
  _db.run(sql, params);
  // sql.js doesn't expose changes/lastInsertRowid directly; we query them
  const [{ values }] = _db.exec("SELECT changes(), last_insert_rowid()");
  persist();
  return {
    changes: values[0][0],
    lastInsertRowid: values[0][1],
  };
}

/**
 * Execute a SELECT and return the first matching row as a plain object,
 * or undefined if no rows matched.
 */
function get(sql, params = []) {
  const result = _db.exec(sql, params);
  if (!result.length || !result[0].values.length) return undefined;
  const { columns, values } = result[0];
  return Object.fromEntries(columns.map((c, i) => [c, values[0][i]]));
}

/**
 * Execute a SELECT and return all matching rows as plain objects.
 */
function all(sql, params = []) {
  const result = _db.exec(sql, params);
  if (!result.length) return [];
  const { columns, values } = result[0];
  return values.map((row) =>
    Object.fromEntries(columns.map((c, i) => [c, row[i]]))
  );
}

/**
 * Execute a raw SQL string (used for schema creation etc.).
 */
function exec(sql) {
  _db.run(sql);
  persist();
}

module.exports = { readyPromise, run, get, all, exec, persist };
