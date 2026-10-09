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
 * AdminController.kt  ←  replaces  routes/admin.js
 *
 * Endpoints (all require JWT with role = 'admin'):
 *   GET    /api/admin/dashboard      – summary stats
 *   GET    /api/admin/users          – list all users
 *   GET    /api/admin/users/:id      – get single user
 *   POST   /api/admin/users          – create a new user
 *   PUT    /api/admin/users/:id      – update user details / password
 *   DELETE /api/admin/users/:id      – deactivate (soft-delete) a user
 *   GET    /api/admin/login-logs     – recent login attempts
 *
 * Demonstrates:
 *   • OOP       : class with constructor injection, private guard/helper methods,
 *                 inner data classes for request bodies
 *   • Data types: String, Long, Int, Boolean, nullable types (?),
 *                 MutableList, Map, List
 *   • Collections: mutableListOf(), mapOf(), filter, map, joinToString
 *   • Inheritance: CreateUserRequest / UpdateUserRequest are standalone
 *                  data classes (mirrors the JS req.body destructuring)
 */

package com.digisociety.backend.controllers

import com.digisociety.backend.config.DatabaseConfig
import com.digisociety.backend.utils.CollectionOpsService
import jakarta.servlet.http.HttpServletRequest
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.web.bind.annotation.*

// ── OOP: request body data classes ───────────────────────────────────────────
data class CreateUserRequest(
    val email:     String  = "",
    val password:  String  = "",
    val full_name: String  = "",
    val role:      String  = "member"
)

data class UpdateUserRequest(
    val full_name: String?  = null,
    val role:      String?  = null,
    val is_active: Boolean? = null,
    val password:  String?  = null
)

// ── OOP: Spring REST controller ───────────────────────────────────────────────
@RestController
@RequestMapping("/api/admin")
class AdminController(
    private val db:                  DatabaseConfig,
    private val passwordEncoder:     BCryptPasswordEncoder,
    private val collectionOpsService: CollectionOpsService
) {

    companion object {
        private val log = LoggerFactory.getLogger(AdminController::class.java)

        // ── Data type: List<String> — valid roles ─────────────────────────────
        private val VALID_ROLES: List<String> = listOf("admin", "member")
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/admin/dashboard
    // ─────────────────────────────────────────────────────────────────────────
    @GetMapping("/dashboard")
    fun dashboard(request: HttpServletRequest): ResponseEntity<Map<String, Any?>> {
        requireAdmin(request)?.let { return it }

        // ── Data type: Long — scalar counts from DB ───────────────────────────
        val totalUsers:   Long = scalarLong("SELECT COUNT(*) AS c FROM users")
        val activeUsers:  Long = scalarLong("SELECT COUNT(*) AS c FROM users WHERE is_active = 1")
        val totalLogins:  Long = scalarLong("SELECT COUNT(*) AS c FROM login_logs WHERE success = 1")
        val failedLogins: Long = scalarLong("SELECT COUNT(*) AS c FROM login_logs WHERE success = 0")

        // ── Collections: List<Map> — recent login rows ────────────────────────
        val recentLogins: List<Map<String, Any?>> = db.all(
            """SELECT logged_at, email, success, ip_address
               FROM login_logs ORDER BY logged_at DESC LIMIT 10"""
        )

        // ── Collections: nested mapOf for response ────────────────────────────
        val stats: Map<String, Long> = mapOf(
            "totalUsers"   to totalUsers,
            "activeUsers"  to activeUsers,
            "totalLogins"  to totalLogins,
            "failedLogins" to failedLogins
        )

        return ok(
            mapOf(
                "success" to true,
                "data"    to mapOf(
                    "stats"        to stats,
                    "recentLogins" to recentLogins
                )
            )
        )
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/admin/users
    // ─────────────────────────────────────────────────────────────────────────
    @GetMapping("/users")
    fun getUsers(request: HttpServletRequest): ResponseEntity<Map<String, Any?>> {
        requireAdmin(request)?.let { return it }

        val users: List<Map<String, Any?>> = db.all(
            "SELECT id, email, full_name, role, is_active, created_at, last_login FROM users ORDER BY id"
        )
        return ok(mapOf("success" to true, "data" to users))
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/admin/users/:id
    // ─────────────────────────────────────────────────────────────────────────
    @GetMapping("/users/{id}")
    fun getUser(
        @PathVariable id: Long,
        request: HttpServletRequest
    ): ResponseEntity<Map<String, Any?>> {
        requireAdmin(request)?.let { return it }

        val user = db.get(
            "SELECT id, email, full_name, role, is_active, created_at, last_login FROM users WHERE id = ?",
            listOf(id)
        ) ?: return notFound("User not found.")

        return ok(mapOf("success" to true, "data" to user))
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/admin/users
    // ─────────────────────────────────────────────────────────────────────────
    @PostMapping("/users")
    fun createUser(
        @RequestBody body: CreateUserRequest,
        request: HttpServletRequest
    ): ResponseEntity<Map<String, Any?>> {
        requireAdmin(request)?.let { return it }

        val email:    String = body.email.trim()
        val password: String = body.password
        val fullName: String = body.full_name.trim()
        val role:     String = body.role.trim()

        if (email.isEmpty() || password.isEmpty()) {
            return bad("Email and password are required.")
        }

        // ── Collections: contains check on List<String> ───────────────────────
        if (role !in VALID_ROLES) {
            return bad("Role must be one of: ${VALID_ROLES.joinToString(", ")}.")
        }

        val existing = db.get(
            "SELECT id FROM users WHERE LOWER(email) = LOWER(?)",
            listOf(email)
        )
        if (existing != null) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(mapOf("success" to false, "message" to "A user with that email already exists."))
        }

        val hash: String = passwordEncoder.encode(password)
        val meta = db.run(
            "INSERT INTO users (email, password, full_name, role) VALUES (?, ?, ?, ?)",
            listOf(email.lowercase(), hash, fullName, role)
        )

        return ResponseEntity.status(HttpStatus.CREATED).body(
            mapOf(
                "success" to true,
                "message" to "User created successfully.",
                "data"    to mapOf(
                    "id"        to meta["lastInsertRowid"],
                    "email"     to email,
                    "full_name" to fullName,
                    "role"      to role
                )
            )
        )
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUT /api/admin/users/:id
    // ─────────────────────────────────────────────────────────────────────────
    @PutMapping("/users/{id}")
    fun updateUser(
        @PathVariable id:   Long,
        @RequestBody   body: UpdateUserRequest,
        request: HttpServletRequest
    ): ResponseEntity<Map<String, Any?>> {
        requireAdmin(request)?.let { return it }

        db.get("SELECT id FROM users WHERE id = ?", listOf(id))
            ?: return notFound("User not found.")

        // ── Collections: MutableList to build SET clauses dynamically ─────────
        val fields: MutableList<String>  = mutableListOf()
        val values: MutableList<Any?>    = mutableListOf()

        body.full_name?.let { fields.add("full_name = ?"); values.add(it) }

        body.role?.let { role ->
            if (role !in VALID_ROLES) return bad("Invalid role.")
            fields.add("role = ?"); values.add(role)
        }

        body.is_active?.let { active ->
            // ── Data type: Int — SQLite uses 0/1 for booleans ─────────────────
            fields.add("is_active = ?"); values.add(if (active) 1 else 0)
        }

        body.password?.takeIf { it.isNotBlank() }?.let { pw ->
            val hash: String = passwordEncoder.encode(pw)
            fields.add("password = ?"); values.add(hash)
        }

        if (fields.isEmpty()) return bad("No fields to update.")

        values.add(id)
        db.run("UPDATE users SET ${fields.joinToString(", ")} WHERE id = ?", values)

        return ok(mapOf("success" to true, "message" to "User updated successfully."))
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DELETE /api/admin/users/:id   (soft-delete — sets is_active = 0)
    // ─────────────────────────────────────────────────────────────────────────
    @DeleteMapping("/users/{id}")
    fun deactivateUser(
        @PathVariable id: Long,
        request: HttpServletRequest
    ): ResponseEntity<Map<String, Any?>> {
        requireAdmin(request)?.let { return it }

        // ── Data type: Long — prevent self-deactivation ───────────────────────
        val requestingUserId: Long = request.getAttribute("userId") as? Long ?: 0L
        if (requestingUserId == id) {
            return bad("You cannot deactivate your own account.")
        }

        db.get("SELECT id FROM users WHERE id = ?", listOf(id))
            ?: return notFound("User not found.")

        db.run("UPDATE users SET is_active = 0 WHERE id = ?", listOf(id))
        return ok(mapOf("success" to true, "message" to "User deactivated successfully."))
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/admin/login-logs
    // ─────────────────────────────────────────────────────────────────────────
    @GetMapping("/login-logs")
    fun loginLogs(
        @RequestParam(defaultValue = "50") limit: Int,
        request: HttpServletRequest
    ): ResponseEntity<Map<String, Any?>> {
        requireAdmin(request)?.let { return it }

        val safeLimit: Int = minOf(limit, 200)

        // ── Collections: List<Map<String,Any?>> ───────────────────────────────
        val logs: List<Map<String, Any?>> = db.all(
            """SELECT id, email, success, ip_address, user_agent, logged_at
               FROM login_logs ORDER BY logged_at DESC LIMIT ?""",
            listOf(safeLimit)
        )

        return ok(mapOf("success" to true, "data" to logs))
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/admin/society-analytics
    // CollectionOps output — map, filter, reduce results from CollectionOps.kt
    // ─────────────────────────────────────────────────────────────────────────
    @GetMapping("/society-analytics")
    fun societyAnalytics(request: HttpServletRequest): ResponseEntity<Map<String, Any?>> {
        requireAdmin(request)?.let { return it }

        val analytics: Map<String, Any?> = collectionOpsService.societyAnalytics()
        return ok(mapOf("success" to true, "data" to analytics))
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * OOP: guard method — reads role set by JwtAuthFilter.
     * Returns a 403 ResponseEntity if the caller is not admin, else null.
     * The ?.let { return it } idiom propagates the error from the call site.
     */
    private fun requireAdmin(request: HttpServletRequest): ResponseEntity<Map<String, Any?>>? {
        val role = request.getAttribute("userRole") as? String
        return if (role != "admin")
            ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(mapOf("success" to false, "message" to "Admin access required."))
        else null
    }

    /** Read a single Long scalar (COUNT etc.) from the database */
    private fun scalarLong(sql: String): Long {
        val row = db.get(sql) ?: return 0L
        // SQLite may return Int or Long depending on driver
        val v = row.values.firstOrNull()
        return when (v) {
            is Long -> v
            is Int  -> v.toLong()
            else    -> 0L
        }
    }

    private fun ok(body: Map<String, Any?>): ResponseEntity<Map<String, Any?>> =
        ResponseEntity.ok(body)

    private fun bad(message: String): ResponseEntity<Map<String, Any?>> =
        ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(mapOf("success" to false, "message" to message))

    private fun notFound(message: String): ResponseEntity<Map<String, Any?>> =
        ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(mapOf("success" to false, "message" to message))
}
