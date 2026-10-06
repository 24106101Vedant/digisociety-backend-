package com.digisociety.backend.models

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "login_logs")
data class LoginLog(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "user_id")
    val userId: Long? = null,

    // society_id included for per-society audit queries
    @Column(name = "society_id")
    val societyId: Long? = null,

    @Column(nullable = false)
    val email: String = "",

    @Column(nullable = false)
    val success: Boolean = false,

    @Column(name = "ip_address")
    val ipAddress: String? = null,

    @Column(name = "user_agent")
    val userAgent: String? = null,

    @Column(name = "logged_at", nullable = false, updatable = false)
    val loggedAt: Instant = Instant.now()
)
