package com.digisociety.backend.models

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "members")
data class Member(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "society_id", nullable = false)
    var societyId: Long = 0,

    @Column(name = "flat_number", nullable = false)
    var flatNumber: String = "",

    @Column(name = "owner_name", nullable = false)
    var ownerName: String = "",

    var email: String? = null,
    var mobile: String? = null,

    // "owner" | "tenant"
    var type: String = "owner",

    @Column(name = "floor_number")
    var floorNumber: Int? = null,

    @Column(name = "area_sqft")
    var areaSqft: Double? = null,

    @Column(name = "move_in_date")
    var moveInDate: String? = null,

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now()
)

data class MemberRequest(
    val societyId: Long = 0,
    val flatNumber: String = "",
    val ownerName: String = "",
    val email: String? = null,
    val mobile: String? = null,
    val type: String = "owner",
    val floorNumber: Int? = null,
    val areaSqft: Double? = null,
    val moveInDate: String? = null
)
