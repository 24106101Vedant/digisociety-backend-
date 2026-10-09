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
 * User.kt  —  domain model for the `users` table
 *
 * Demonstrates:
 *   • OOP       : data class, open class, inheritance, sealed class
 *   • Data types: String, Int, Long, Boolean, nullable types (?)
 *   • Collections: used in companion object factory methods
 */

package com.digisociety.backend.models

// ── OOP: data class — auto-generates equals / hashCode / toString / copy ────
/**
 * Full user row as stored in the database.
 * Maps 1-to-1 with the `users` table.
 */
data class User(
    val id:        Long,               // Data type: Long  (SQLite INTEGER)
    val email:     String,             // Data type: String (NOT NULL)
    val password:  String,             // Data type: String (bcrypt hash)
    val fullName:  String  = "",       // Data type: String (DEFAULT '')
    val name:      String? = null,     // Data type: nullable String
    val mobile:    String? = null,     // Data type: nullable String
    val role:      String  = "member", // Data type: String
    val isActive:  Int     = 1,        // Data type: Int  (0 / 1 flag)
    val createdAt: String? = null,     // Data type: nullable String (ISO timestamp)
    val lastLogin: String? = null      // Data type: nullable String
) {
    // ── OOP: companion object — factory / helper methods (like static) ───────
    companion object {
        /**
         * Build a User from the raw Map<String, Any?> returned by
         * DatabaseConfig.get() / all().
         * Demonstrates: safe casts, Elvis operator (?:), collection access
         */
        fun fromRow(row: Map<String, Any?>): User = User(
            id        = (row["id"]        as? Long   ?: (row["id"] as? Int)?.toLong()  ?: 0L),
            email     = (row["email"]     as? String ?: ""),
            password  = (row["password"]  as? String ?: ""),
            fullName  = (row["full_name"] as? String ?: ""),
            name      = (row["name"]      as? String),
            mobile    = (row["mobile"]    as? String),
            role      = (row["role"]      as? String ?: "member"),
            isActive  = (row["is_active"] as? Int    ?: (row["is_active"] as? Long)?.toInt() ?: 1),
            createdAt = (row["created_at"] as? String),
            lastLogin = (row["last_login"] as? String)
        )
    }

    /**
     * Returns a safe public view — strips the password hash.
     * Used in /api/auth/me and login responses.
     * Demonstrates: data class copy(), map creation
     */
    fun toPublicMap(): Map<String, Any?> = mapOf(
        "id"         to id,
        "email"      to email,
        "full_name"  to fullName,
        "name"       to name,
        "mobile"     to mobile,
        "role"       to role,
        "is_active"  to isActive,
        "created_at" to createdAt,
        "last_login" to lastLogin
    )
}

// ── OOP: open class — base request body (can be subclassed / extended) ───────
/**
 * Base class for auth-related request bodies.
 * Shows inheritance: RegisterRequest and LoginRequest extend this.
 */
open class AuthRequest(
    open val email:    String = "",
    open val password: String = ""
)

// ── OOP: data class inheriting from AuthRequest ───────────────────────────────
data class RegisterRequest(
    val name:            String  = "",
    val mobile:          String? = null,
    override val email:    String  = "",
    override val password: String  = ""
) : AuthRequest(email, password)

// ── OOP: data class inheriting from AuthRequest ───────────────────────────────
data class LoginRequest(
    override val email:    String = "",
    override val password: String = ""
) : AuthRequest(email, password)

// ── OOP: data class for forgot-password request ───────────────────────────────
data class ForgotPasswordRequest(
    val email: String = ""
)

// ── OOP: sealed class — models all auth response variants ────────────────────
/**
 * Sealed class hierarchy:  AuthResponse
 *   ├── Success  (contains token + user map)
 *   └── Failure  (contains error message)
 *
 * Sealed classes are a Kotlin OOP feature: the compiler knows every subtype,
 * enabling exhaustive `when` expressions.
 */
sealed class AuthResponse {
    data class Success(
        val token: String,
        val user:  Map<String, Any?>
    ) : AuthResponse()

    data class Failure(
        val message: String,
        val code:    Int = 400
    ) : AuthResponse()
}
