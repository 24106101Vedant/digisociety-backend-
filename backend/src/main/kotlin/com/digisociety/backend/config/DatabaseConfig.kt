/*
 * ─────────────────────────────────────────────────────────────────────────────
 * Lab Outcome : Implement backend services in Kotlin with database integration
 *               and secure authentication.
 *
 * Aim 1       : Write Kotlin programs to demonstrate data types, collections,
 *               and OOP concepts (classes, inheritance).
 *
 * Aim 2       : Write Kotlin program to implement exception handling and use
 *               collection operations (map, filter, reduce).
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * DatabaseConfig.kt  ←  replaces  config/db.js + config/createTables.js
 *                                 + db/database.js
 *
 * Responsibilities:
 *   1. Open (or create) the SQLite database file on disk.
 *   2. Create all tables (users, enquiries, login_logs) if they don't exist.
 *   3. Expose thin synchronous helpers: run(), get(), all()
 *      — mirrors the same API surface the JS version provided so controllers
 *        can be ported 1-to-1.
 *
 * Demonstrates:
 *   • OOP      : class with constructor, companion object, init block
 *   • Data types: String, Int, Long, Boolean, Map<String, Any?>, List<Any?>
 *   • Collections: MutableList, List, Map
 *   • Inheritance: DatabaseConfig is a Spring @Component (bean) — it
 *                  is injected wherever the db is needed, replacing the
 *                  require("./db") pattern from Node.
 */

package com.digisociety.backend.config

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.stereotype.Component
import java.io.File
import java.sql.Connection
import java.sql.DriverManager
import java.sql.ResultSet
import javax.annotation.PostConstruct

// ── OOP: Spring-managed component (bean) ────────────────────────────────────
@Component
class DatabaseConfig(
    private val passwordEncoder: BCryptPasswordEncoder
) {

    // ── Data types: String property from application.properties / env ────────
    @Value("\${DB_PATH:./data/digisociety.db}")
    private lateinit var dbPath: String

    // ── Companion object: holds logger (like module-level const in JS) ───────
    companion object {
        private val log = LoggerFactory.getLogger(DatabaseConfig::class.java)
    }

    // Lazily opened JDBC connection
    private lateinit var connection: Connection

    /**
     * @PostConstruct runs once after Spring injects all fields —
     * equivalent to the async IIFE in database.js.
     */
    @PostConstruct
    fun init() {
        // Ensure parent directory exists
        val dbFile = File(dbPath)
        dbFile.parentFile?.mkdirs()

        // ── Data type: String (JDBC URL) ─────────────────────────────────────
        val jdbcUrl: String = "jdbc:sqlite:${dbFile.absolutePath}"
        connection = DriverManager.getConnection(jdbcUrl)
        connection.autoCommit = true

        log.info("✅  SQLite database opened at: ${dbFile.absolutePath}")
        createTables()
        log.info("✅  Tables verified / created.")
    }

    // ─────────────────────────────────────────────────────────────────────────
    // createTables()  ←  replaces createTables.js
    // ─────────────────────────────────────────────────────────────────────────
    private fun createTables() {
        // ── Collections: list of DDL statements ──────────────────────────────
        val ddlStatements: List<String> = listOf(
            """
            CREATE TABLE IF NOT EXISTS users (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                email       TEXT    NOT NULL UNIQUE,
                password    TEXT    NOT NULL,
                full_name   TEXT    NOT NULL DEFAULT '',
                name        TEXT,
                mobile      TEXT,
                role        TEXT    NOT NULL DEFAULT 'member',
                is_active   INTEGER NOT NULL DEFAULT 1,
                created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
                last_login  TEXT
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS enquiries (
                id             INTEGER PRIMARY KEY AUTOINCREMENT,
                society_name   TEXT,
                chairman_name  TEXT,
                email          TEXT,
                mobile         TEXT,
                status         TEXT NOT NULL DEFAULT 'New',
                created_at     TEXT NOT NULL DEFAULT (datetime('now'))
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS login_logs (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id     INTEGER,
                email       TEXT    NOT NULL,
                success     INTEGER NOT NULL,
                ip_address  TEXT,
                user_agent  TEXT,
                logged_at   TEXT    NOT NULL DEFAULT (datetime('now'))
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS documents (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id       INTEGER NOT NULL,
                category      TEXT    NOT NULL DEFAULT 'general',
                original_name TEXT    NOT NULL,
                s3_key        TEXT    NOT NULL UNIQUE,
                content_type  TEXT    NOT NULL,
                size_bytes    INTEGER NOT NULL DEFAULT 0,
                uploaded_at   TEXT    NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
            """
        )

        // ── Collections: iterate over list ───────────────────────────────────
        ddlStatements.forEach { sql ->
            connection.createStatement().use { stmt ->
                stmt.execute(sql.trimIndent())
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // run()  —  INSERT / UPDATE / DELETE / CREATE
    // Returns a map with "changes" and "lastInsertRowid" (mirrors JS version)
    // ─────────────────────────────────────────────────────────────────────────
    fun run(sql: String, params: List<Any?> = emptyList()): Map<String, Long> {
        connection.prepareStatement(sql).use { stmt ->
            // ── Collections: iterate params with index ────────────────────────
            params.forEachIndexed { index, value ->
                stmt.setObject(index + 1, value)
            }
            stmt.executeUpdate()
        }

        // SQLite last_insert_rowid() and changes()
        val meta: Map<String, Long> = connection.createStatement().use { stmt ->
            val rs: ResultSet = stmt.executeQuery(
                "SELECT changes() AS changes, last_insert_rowid() AS lastId"
            )
            if (rs.next()) {
                mapOf(
                    "changes"          to rs.getLong("changes"),
                    "lastInsertRowid"  to rs.getLong("lastId")
                )
            } else {
                mapOf("changes" to 0L, "lastInsertRowid" to 0L)
            }
        }
        return meta
    }

    // ─────────────────────────────────────────────────────────────────────────
    // get()  —  SELECT returning first row as Map, or null if no rows
    // ─────────────────────────────────────────────────────────────────────────
    fun get(sql: String, params: List<Any?> = emptyList()): Map<String, Any?>? {
        connection.prepareStatement(sql).use { stmt ->
            params.forEachIndexed { index, value -> stmt.setObject(index + 1, value) }
            val rs: ResultSet = stmt.executeQuery()
            if (!rs.next()) return null

            val meta = rs.metaData
            // ── Collections: build Map from column names ──────────────────────
            val row: MutableMap<String, Any?> = mutableMapOf()
            for (i in 1..meta.columnCount) {
                row[meta.getColumnLabel(i)] = rs.getObject(i)
            }
            return row
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // all()  —  SELECT returning all rows as List<Map>
    // ─────────────────────────────────────────────────────────────────────────
    fun all(sql: String, params: List<Any?> = emptyList()): List<Map<String, Any?>> {
        connection.prepareStatement(sql).use { stmt ->
            params.forEachIndexed { index, value -> stmt.setObject(index + 1, value) }
            val rs: ResultSet = stmt.executeQuery()
            val meta          = rs.metaData
            val columnCount:  Int = meta.columnCount

            // ── Collections: build List of Maps ──────────────────────────────
            val results: MutableList<Map<String, Any?>> = mutableListOf()
            while (rs.next()) {
                val row: MutableMap<String, Any?> = mutableMapOf()
                for (i in 1..columnCount) {
                    row[meta.getColumnLabel(i)] = rs.getObject(i)
                }
                results.add(row)
            }
            return results
        }
    }
}
