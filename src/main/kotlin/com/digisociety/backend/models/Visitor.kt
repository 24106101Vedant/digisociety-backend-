package com.digisociety.backend.models

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "visitors")
data class Visitor(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "society_id", nullable = false)
    var societyId: Long = 0,

    @Column(name = "visitor_name", nullable = false)
    var visitorName: String = "",

    var mobile: String? = null,

    @Column(name = "flat_to_visit")
    var flatToVisit: String? = null,

    var purpose: String? = null,

    // "in" | "out"
    var status: String = "in",

    @Column(name = "entry_time", nullable = false)
    val entryTime: Instant = Instant.now(),

    @Column(name = "exit_time")
    var exitTime: Instant? = null
)

data class VisitorRequest(
    val societyId: Long = 0,
    val visitorName: String = "",
    val mobile: String? = null,
    val flatToVisit: String? = null,
    val purpose: String? = null
)

data class VisitorUpdateRequest(
    val status: String? = null,
    val exitTime: Instant? = null
)
