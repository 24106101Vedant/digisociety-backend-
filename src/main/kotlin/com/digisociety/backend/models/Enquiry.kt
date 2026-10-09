package com.digisociety.backend.models

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "enquiries")
data class Enquiry(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "society_name")
    var societyName: String = "",

    @Column(name = "chairman_name")
    var chairmanName: String = "",

    var email: String = "",
    var mobile: String = "",

    // "New" | "Contacted" | "Closed"
    var status: String = "New",

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now()
)

data class CreateEnquiryRequest(
    val society_name: String = "",
    val chairman_name: String = "",
    val email: String = "",
    val mobile: String = ""
)

data class UpdateEnquiryStatusRequest(val status: String = "")

enum class EnquiryStatus(val label: String) {
    NEW("New"), CONTACTED("Contacted"), CLOSED("Closed");

    companion object {
        fun fromString(value: String?): EnquiryStatus? =
            entries.firstOrNull { it.label.equals(value, ignoreCase = true) }
        val validLabels: List<String> = entries.map { it.label }
    }
}
