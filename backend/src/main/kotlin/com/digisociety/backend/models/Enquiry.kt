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
 * Enquiry.kt  —  domain model for the `enquiries` table
 *
 * Demonstrates:
 *   • OOP       : data class, enum class, companion object, inheritance
 *   • Data types: String, Long, Int, nullable types (?), enum constants
 *   • Collections: enumValues<>(), List, Map
 */

package com.digisociety.backend.models

// ── OOP: enum class — replaces the magic-string status values ────────────────
/**
 * Valid enquiry statuses.
 * Demonstrates: enum class with a property (label: String) and companion
 * object factory (fromString), showing OOP + data types together.
 */
enum class EnquiryStatus(val label: String) {
    NEW("New"),
    CONTACTED("Contacted"),
    CLOSED("Closed");

    // ── OOP: companion object on enum ─────────────────────────────────────
    companion object {
        /**
         * Safe lookup from a raw string value.
         * Returns null if the string is not a valid status.
         * Demonstrates: collections (enumValues), nullable return type
         */
        fun fromString(value: String?): EnquiryStatus? =
            enumValues<EnquiryStatus>().firstOrNull {
                it.label.equals(value, ignoreCase = true)
            }

        /** All valid labels as a List<String> — used for validation messages */
        val validLabels: List<String> = enumValues<EnquiryStatus>().map { it.label }
    }
}

// ── OOP: data class — row from the `enquiries` table ─────────────────────────
/**
 * Maps 1-to-1 with the `enquiries` table schema.
 */
data class Enquiry(
    val id:            Long,                        // Data type: Long
    val societyName:   String  = "",                // Data type: String
    val chairmanName:  String  = "",                // Data type: String
    val email:         String  = "",                // Data type: String
    val mobile:        String  = "",                // Data type: String
    val status:        String  = EnquiryStatus.NEW.label, // Data type: String
    val createdAt:     String? = null               // Data type: nullable String
) {
    // ── OOP: companion object factory ────────────────────────────────────────
    companion object {
        /**
         * Build an Enquiry from the raw Map returned by DatabaseConfig helpers.
         * Demonstrates: safe casts, Elvis operator, collection map access.
         */
        fun fromRow(row: Map<String, Any?>): Enquiry = Enquiry(
            id           = (row["id"]             as? Long ?: (row["id"] as? Int)?.toLong() ?: 0L),
            societyName  = (row["society_name"]   as? String ?: ""),
            chairmanName = (row["chairman_name"]  as? String ?: ""),
            email        = (row["email"]          as? String ?: ""),
            mobile       = (row["mobile"]         as? String ?: ""),
            status       = (row["status"]         as? String ?: EnquiryStatus.NEW.label),
            createdAt    = (row["created_at"]     as? String)
        )
    }

    /** Converts the domain object to a plain Map for JSON serialisation */
    fun toMap(): Map<String, Any?> = mapOf(
        "id"            to id,
        "society_name"  to societyName,
        "chairman_name" to chairmanName,
        "email"         to email,
        "mobile"        to mobile,
        "status"        to status,
        "created_at"    to createdAt
    )
}

// ── OOP: data class — request body for POST /api/enquiry ─────────────────────
data class CreateEnquiryRequest(
    val society_name:  String = "",
    val chairman_name: String = "",
    val email:         String = "",
    val mobile:        String = ""
)

// ── OOP: data class — request body for PUT /api/enquiry/:id ──────────────────
data class UpdateEnquiryStatusRequest(
    val status: String = ""
)

// ── OOP: open base class for paginated list responses (inheritance demo) ──────
open class PagedResponse<T>(
    open val success: Boolean       = true,
    open val data:    List<T>       = emptyList(),
    open val total:   Long          = 0L
)

// ── OOP: subclass — concrete enquiry list response ───────────────────────────
class EnquiryListResponse(
    override val data:  List<Map<String, Any?>> = emptyList(),
    override val total: Long                    = 0L
) : PagedResponse<Map<String, Any?>>(success = true, data = data, total = total)
