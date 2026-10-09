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
 * AuthController.kt  ←  replaces  controllers/authController.js
 *                                 + routes/auth.js
 *
 * Endpoints:
 *   POST  /api/auth/register        – create a new user account
 *   POST  /api/auth/login           – validate credentials, return JWT
 *   GET   /api/auth/me              – return current user (protected)
 *   POST  /api/auth/logout          – stateless token drop
 *   POST  /api/auth/forgot-password – request password reset link
 *
 * Demonstrates:
 *   • OOP       : class with constructor injection, private helper functions
 *   • Data types: String, Boolean, Long, Int, nullable types (?)
 *   • Collections: mapOf(), mutableMapOf(), listOf()
 *   • Inheritance: uses sealed class AuthResponse from User.kt
 */

package com.digisociety.backend.controllers

import com.digisociety.backend.config.DatabaseConfig
import com.digisociety.backend.models.*
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.SignatureAlgorithm
import io.jsonwebtoken.security.Keys
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.web.bind.annotation.*
import java.util.Date
import jakarta.servlet.http.HttpServletRequest

// ── OOP: Spring REST controller class with constructor injection ─────────────
@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val db:              DatabaseConfig,
    private val passwordEncoder: BCryptPasswordEncoder
) {

    // ── OOP: companion object holds logger + JWT constants ───────────────────
    companion object {
        private val log = LoggerFactory.getLogger(AuthController::class.java)
    }

    @Value("\${JWT_SECRET:DigisocietySecret123}")
    private lateinit var jwtSecret: String

    @Value("\${JWT_EXPIRES_MS:28800000}") // 8 hours in ms
    private var jwtExpiresMs: Long = 28_800_000L

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/auth/register
    // ─────────────────────────────────────────────────────────────────────────
    @PostMapping("/register")
    fun register(@RequestBody body: RegisterRequest): ResponseEntity<Map<String, Any?>> {

        // ── Data types: String destructuring + trimming ──────────────────────
        val name:     String  = body.name.trim()
        val email:    String  = body.email.trim()
        val mobile:   String? = body.mobile?.trim()
        val password: String  = body.password

        // Validate required fields
        if (name.isEmpty() || email.isEmpty() || password.isEmpty()) {
            return bad("Name, email, and password are required.")
        }

        // Basic email format check
        if (!EMAIL_REGEX.matches(email)) {
            return bad("Invalid email address.")
        }

        // Password length check
        if (password.length < 6) {
            return bad("Password must be at least 6 characters.")
        }

        // Check if email already registered
        val existing = db.get(
            "SELECT id FROM users WHERE LOWER(email) = LOWER(?)",
            listOf(email)
        )
        if (existing != null) {
            return conflict("An account with that email already exists.")
        }

        // Hash password and insert user
        val hash: String = passwordEncoder.encode(password)
        val meta = db.run(
            """INSERT INTO users (name, email, mobile, password, full_name)
               VALUES (?, ?, ?, ?, ?)""",
            listOf(name, email.lowercase(), mobile, hash, name)
        )

        // ── Collections: build response map ──────────────────────────────────
        val newUser: Map<String, Any?> = mapOf(
            "id"     to meta["lastInsertRowid"],
            "name"   to name,
            "email"  to email.lowercase(),
            "mobile" to mobile,
            "role"   to "member"
        )

        return ResponseEntity.status(HttpStatus.CREATED).body(
            mapOf("success" to true, "message" to "Account created successfully.", "data" to newUser)
        )
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/auth/login
    // ─────────────────────────────────────────────────────────────────────────
    @PostMapping("/login")
    fun login(
        @RequestBody body: LoginRequest,
        request: HttpServletRequest
    ): ResponseEntity<Map<String, Any?>> {

        val email:    String = body.email.trim()
        val password: String = body.password

        if (email.isEmpty() || password.isEmpty()) {
            return bad("Email and password are required.")
        }

        // Find user by email
        val row = db.get(
            "SELECT * FROM users WHERE LOWER(email) = LOWER(?)",
            listOf(email)
        )

        if (row == null) {
            logAttempt(userId = null, email = email, success = false, request = request)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(mapOf("success" to false, "message" to "Invalid email or password."))
        }

        val user = User.fromRow(row)

        // Check if account is active
        if (user.isActive == 0) {
            logAttempt(userId = user.id, email = email, success = false, request = request)
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                mapOf("success" to false, "message" to "Your account has been disabled. Please contact support.")
            )
        }

        // Compare password with stored hash
        val passwordMatch: Boolean = passwordEncoder.matches(password, user.password)
        if (!passwordMatch) {
            logAttempt(userId = user.id, email = email, success = false, request = request)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(mapOf("success" to false, "message" to "Invalid email or password."))
        }

        // Update last_login timestamp
        db.run(
            "UPDATE users SET last_login = datetime('now') WHERE id = ?",
            listOf(user.id)
        )

        logAttempt(userId = user.id, email = email, success = true, request = request)

        // Generate JWT token
        val token: String = generateToken(user.id)

        // ── Collections: public user map ──────────────────────────────────────
        val publicUser: Map<String, Any?> = mapOf(
            "id"     to user.id,
            "name"   to (user.name ?: user.fullName),
            "email"  to user.email,
            "mobile" to user.mobile,
            "role"   to user.role
        )

        return ok(
            mapOf(
                "success" to true,
                "message" to "Login successful.",
                "token"   to token,
                "user"    to publicUser
            )
        )
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/auth/me  (protected — JwtAuthFilter sets request attribute)
    // ─────────────────────────────────────────────────────────────────────────
    @GetMapping("/me")
    fun getMe(request: HttpServletRequest): ResponseEntity<Map<String, Any?>> {
        // ── Data type: Long (user id from JWT filter) ─────────────────────────
        val userId: Long = (request.getAttribute("userId") as? Long)
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(mapOf("success" to false, "message" to "Not authenticated."))

        val row = db.get(
            """SELECT id, name, email, mobile, role, is_active, created_at, last_login
               FROM users WHERE id = ?""",
            listOf(userId)
        ) ?: return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(mapOf("success" to false, "message" to "User not found."))

        return ok(mapOf("success" to true, "user" to row))
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/auth/logout
    // ─────────────────────────────────────────────────────────────────────────
    @PostMapping("/logout")
    fun logout(): ResponseEntity<Map<String, Any?>> =
        // Stateless JWT — client discards the token
        ok(mapOf("success" to true, "message" to "Logged out successfully."))

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/auth/forgot-password
    // ─────────────────────────────────────────────────────────────────────────
    @PostMapping("/forgot-password")
    fun forgotPassword(@RequestBody body: ForgotPasswordRequest): ResponseEntity<Map<String, Any?>> {
        val email: String = body.email.trim()

        if (email.isEmpty()) {
            return bad("Email is required.")
        }

        val existing = db.get(
            "SELECT id FROM users WHERE LOWER(email) = LOWER(?)",
            listOf(email)
        )

        if (existing != null) {
            // TODO: generate reset token and send email
            log.info("[forgot-password] Reset requested for: $email (id=${existing["id"]})")
        }

        // Always return same response (prevents email enumeration)
        return ok(
            mapOf(
                "success" to true,
                "message" to "If that email is registered, a password reset link has been sent."
            )
        )
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers  (OOP: encapsulated utility methods)
    // ─────────────────────────────────────────────────────────────────────────

    /** Generate a signed JWT for the given user ID */
    private fun generateToken(userId: Long): String {
        val key = Keys.hmacShaKeyFor(jwtSecret.toByteArray())
        return Jwts.builder()
            .setSubject(userId.toString())
            .setIssuedAt(Date())
            .setExpiration(Date(System.currentTimeMillis() + jwtExpiresMs))
            .signWith(key, SignatureAlgorithm.HS256)
            .compact()
    }

    /** Record a login attempt in login_logs — mirrors logAttempt() from JS */
    private fun logAttempt(
        userId:  Long?,
        email:   String,
        success: Boolean,
        request: HttpServletRequest
    ) {
        try {
            db.run(
                """INSERT INTO login_logs (user_id, email, success, ip_address, user_agent)
                   VALUES (?, ?, ?, ?, ?)""",
                listOf(
                    userId,
                    email,
                    if (success) 1 else 0,          // Data type: Int (0/1 flag)
                    request.remoteAddr,
                    request.getHeader("User-Agent")
                )
            )
        } catch (e: Exception) {
            log.warn("[logAttempt] Failed to write login log: ${e.message}")
        }
    }

    /** 200 OK wrapper */
    private fun ok(body: Map<String, Any?>): ResponseEntity<Map<String, Any?>> =
        ResponseEntity.ok(body)

    /** 400 Bad Request wrapper */
    private fun bad(message: String): ResponseEntity<Map<String, Any?>> =
        ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(mapOf("success" to false, "message" to message))

    /** 409 Conflict wrapper */
    private fun conflict(message: String): ResponseEntity<Map<String, Any?>> =
        ResponseEntity.status(HttpStatus.CONFLICT)
            .body(mapOf("success" to false, "message" to message))

    // ── Companion: shared regex constant (data type: Regex) ──────────────────
    private companion object {
        val EMAIL_REGEX = Regex("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")
    }
}
