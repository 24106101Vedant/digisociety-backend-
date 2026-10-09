package com.digisociety.backend.models

import jakarta.persistence.*
import java.time.Instant

/**
 * Stores a BCrypt hash of the reset token — never the raw token.
 * The raw token is sent to the user's email; only the hash lives in the DB.
 */
@Entity
@Table(name = "password_reset_tokens")
data class PasswordResetToken(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "user_id", nullable = false)
    val userId: Long = 0,

    // BCrypt hash of the raw token sent to the user
    @Column(name = "token_hash", nullable = false)
    val tokenHash: String = "",

    @Column(name = "expires_at", nullable = false)
    val expiresAt: Instant = Instant.now().plusSeconds(3600), // 1 hour

    @Column(nullable = false)
    var used: Boolean = false,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now()
)
