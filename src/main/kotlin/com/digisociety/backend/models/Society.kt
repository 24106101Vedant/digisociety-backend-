package com.digisociety.backend.models

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "societies")
data class Society(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "society_name", nullable = false)
    var societyName: String = "",

    // Primary contact email for the society account (unique)
    @Column(nullable = false, unique = true)
    var email: String = "",

    var mobile: String? = null,
    var address: String? = null,
    var city: String? = null,
    var state: String? = null,
    var pincode: String? = null,

    @Column(name = "registration_number", unique = true)
    var registrationNumber: String? = null,

    @Column(name = "chairman_name")
    var chairmanName: String? = null,

    @Column(name = "chairman_mobile")
    var chairmanMobile: String? = null,

    @Column(name = "secretary_name")
    var secretaryName: String? = null,

    @Column(name = "secretary_mobile")
    var secretaryMobile: String? = null,

    @Column(name = "total_units")
    var totalUnits: Int = 0,

    // "pending" | "active" | "suspended"
    var status: String = "active",

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now()
)

data class SocietyRequest(
    val societyName: String = "",
    val email: String = "",
    val mobile: String? = null,
    val address: String? = null,
    val city: String? = null,
    val state: String? = null,
    val pincode: String? = null,
    val registrationNumber: String? = null,
    val chairmanName: String? = null,
    val chairmanMobile: String? = null,
    val secretaryName: String? = null,
    val totalUnits: Int = 0
)
