package com.digisociety.backend.models

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "complaints")
data class Complaint(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "society_id", nullable = false)
    var societyId: Long = 0,

    @Column(name = "member_id")
    var memberId: Long? = null,

    @Column(nullable = false)
    var subject: String = "",

    @Column(columnDefinition = "TEXT")
    var description: String = "",

    // "open" | "in_progress" | "resolved" | "closed"
    var status: String = "open",

    // "low" | "medium" | "high"
    var priority: String = "medium",

    @Column(name = "resolved_at")
    var resolvedAt: Instant? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now()
)

data class ComplaintRequest(
    val societyId: Long = 0,
    val memberId: Long? = null,
    val subject: String = "",
    val description: String = "",
    val priority: String = "medium"
)

data class ComplaintUpdateRequest(
    val subject: String? = null,
    val description: String? = null,
    val status: String? = null,
    val priority: String? = null
)
