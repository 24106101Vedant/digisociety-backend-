package com.digisociety.backend.models

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "users")
data class User(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    // THE isolation key: every user belongs to exactly one society (null = super_admin)
    @Column(name = "society_id")
    var societyId: Long? = null,

    @Column(nullable = false, unique = true)
    var email: String = "",

    // BCrypt hash ONLY — never plain text
    @Column(name = "password_hash", nullable = false)
    var passwordHash: String = "",

    @Column(name = "full_name")
    var fullName: String = "",

    var mobile: String? = null,

    // "super_admin" | "society_admin" | "manager" | "member" | "staff"
    @Column(nullable = false)
    var role: String = "society_admin",

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),

    @Column(name = "last_login")
    var lastLogin: Instant? = null
)

// ── DTOs ────────────────────────────────────────────────────────────────────

data class RegisterRequest(
    val name: String = "",
    val email: String = "",
    val password: String = "",
    val mobile: String? = null,
    val societyId: Long? = null        // provided when registering under an existing society
)

data class LoginRequest(
    val email: String = "",
    val password: String = ""
)

data class ForgotPasswordRequest(val email: String = "")

data class SendOtpRequest(val email: String = "")
data class VerifyOtpRequest(val email: String = "", val otp: String = "")

data class ResetPasswordRequest(
    val token: String = "",            // the raw reset token (backend hashes & compares)
    val newPassword: String = ""
)

data class UserResponse(
    val id: Long,
    val societyId: Long?,
    val email: String,
    val fullName: String,
    val mobile: String?,
    val role: String,
    val isActive: Boolean,
    val createdAt: Instant,
    val lastLogin: Instant?
)

fun User.toResponse() = UserResponse(
    id = id, societyId = societyId, email = email, fullName = fullName,
    mobile = mobile, role = role, isActive = isActive,
    createdAt = createdAt, lastLogin = lastLogin
)
