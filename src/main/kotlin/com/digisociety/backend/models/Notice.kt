package com.digisociety.backend.models

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "notices")
data class Notice(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "society_id", nullable = false)
    var societyId: Long = 0,

    @Column(name = "posted_by")
    var postedBy: Long? = null,

    @Column(nullable = false)
    var title: String = "",

    @Column(columnDefinition = "TEXT", nullable = false)
    var content: String = "",

    // "general" | "urgent" | "meeting" | "maintenance"
    var category: String = "general",

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true,

    @Column(name = "expires_at")
    var expiresAt: Instant? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now()
)

data class NoticeRequest(
    val societyId: Long = 0,
    val title: String = "",
    val content: String = "",
    val category: String = "general",
    val expiresAt: Instant? = null
)

data class NoticeUpdateRequest(
    val title: String? = null,
    val content: String? = null,
    val category: String? = null,
    val isActive: Boolean? = null,
    val expiresAt: Instant? = null
)
