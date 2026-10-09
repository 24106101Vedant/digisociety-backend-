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
 * EnquiryController.kt  ←  replaces  controllers/enquiryController.js
 *                                     + routes/enquiry.js
 *
 * Endpoints:
 *   POST  /api/enquiry       – submit a new society enquiry (public)
 *   GET   /api/enquiry       – list all enquiries (admin only)
 *   PUT   /api/enquiry/:id   – update enquiry status (admin only)
 *
 * Demonstrates:
 *   • OOP       : class with constructor injection, private helper methods
 *   • Data types: String, Long, Int, Boolean, nullable types (?)
 *   • Collections: mapOf(), mutableListOf(), List<Map<String,Any?>>
 *   • Inheritance: uses EnquiryStatus enum + PagedResponse / EnquiryListResponse
 *                  from Enquiry.kt
 */

package com.digisociety.backend.controllers

import com.digisociety.backend.config.DatabaseConfig
import com.digisociety.backend.models.CreateEnquiryRequest
import com.digisociety.backend.models.EnquiryStatus
import com.digisociety.backend.models.UpdateEnquiryStatusRequest
import jakarta.servlet.http.HttpServletRequest
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

// ── OOP: Spring REST controller class ────────────────────────────────────────
@RestController
@RequestMapping("/api/enquiry")
class EnquiryController(
    private val db: DatabaseConfig
) {

    // ── OOP: companion object — logger ───────────────────────────────────────
    companion object {
        private val log = LoggerFactory.getLogger(EnquiryController::class.java)

        // Data type: Regex — email validation
        private val EMAIL_REGEX = Regex("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/enquiry   (public — no auth required)
    // ─────────────────────────────────────────────────────────────────────────
    @PostMapping
    fun createEnquiry(
        @RequestBody body: CreateEnquiryRequest
    ): ResponseEntity<Map<String, Any?>> {

        // ── Data types: String trimming ───────────────────────────────────────
        val societyName:  String = body.society_name.trim()
        val chairmanName: String = body.chairman_name.trim()
        val email:        String = body.email.trim()
        val mobile:       String = body.mobile.trim()

        // Validate required fields
        if (societyName.isEmpty() || chairmanName.isEmpty() ||
            email.isEmpty()       || mobile.isEmpty()) {
            return bad("Society name, chairman name, email, and mobile are required.")
        }

        // Email format check
        if (!EMAIL_REGEX.matches(email)) {
            return bad("Invalid email address.")
        }

        log.info("[createEnquiry] Received: society=$societyName, email=$email")

        // Insert into SQLite enquiries table
        db.run(
            """INSERT INTO enquiries (society_name, chairman_name, email, mobile)
               VALUES (?, ?, ?, ?)""",
            listOf(societyName, chairmanName, email.lowercase(), mobile)
        )

        return ResponseEntity.status(HttpStatus.CREATED).body(
            mapOf(
                "success" to true,
                "message" to "Enquiry submitted successfully. We will contact you soon."
            )
        )
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/enquiry   (admin only — JWT filter + role check)
    // ─────────────────────────────────────────────────────────────────────────
    @GetMapping
    fun getAllEnquiries(
        @RequestParam(defaultValue = "50")  limit:  Int,
        @RequestParam(defaultValue = "0")   offset: Int,
        @RequestParam(required = false)     status: String?,
        request: HttpServletRequest
    ): ResponseEntity<Map<String, Any?>> {

        // ── OOP: role guard — mirrors requireAdmin middleware in JS ────────────
        if (!isAdmin(request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(mapOf("success" to false, "message" to "Admin access required."))
        }

        // ── Data type: Int — clamp limit to max 200 ───────────────────────────
        val safeLimit:  Int = minOf(limit, 200)
        val safeOffset: Int = maxOf(offset, 0)

        // ── Collections: build params list dynamically ────────────────────────
        val params: MutableList<Any?> = mutableListOf()
        val whereClause: String = if (!status.isNullOrBlank()) {
            params.add(status)
            "WHERE status = ?"
        } else ""

        val sql = "SELECT * FROM enquiries $whereClause ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.add(safeLimit)
        params.add(safeOffset)

        // ── Collections: List<Map<String, Any?>> — enquiry rows ──────────────
        val enquiries: List<Map<String, Any?>> = db.all(sql, params)

        // Get total count
        val countSql    = "SELECT COUNT(*) AS total FROM enquiries $whereClause"
        val countParams = if (!status.isNullOrBlank()) listOf(status) else emptyList()
        val countRow    = db.get(countSql, countParams)
        val total: Long = (countRow?.get("total") as? Long)
            ?: (countRow?.get("total") as? Int)?.toLong()
            ?: 0L

        return ok(
            mapOf(
                "success" to true,
                "data"    to enquiries,
                "total"   to total
            )
        )
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUT /api/enquiry/:id   (admin only)
    // ─────────────────────────────────────────────────────────────────────────
    @PutMapping("/{id}")
    fun updateStatus(
        @PathVariable id:    Long,
        @RequestBody   body: UpdateEnquiryStatusRequest,
        request: HttpServletRequest
    ): ResponseEntity<Map<String, Any?>> {

        if (!isAdmin(request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(mapOf("success" to false, "message" to "Admin access required."))
        }

        // ── OOP: use EnquiryStatus enum for validation (from Enquiry.kt) ──────
        val newStatus = EnquiryStatus.fromString(body.status)
            ?: return bad(
                "Status must be one of: ${EnquiryStatus.validLabels.joinToString(", ")}."
            )

        // Check enquiry exists
        val existing = db.get("SELECT id FROM enquiries WHERE id = ?", listOf(id))
            ?: return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(mapOf("success" to false, "message" to "Enquiry not found."))

        db.run(
            "UPDATE enquiries SET status = ? WHERE id = ?",
            listOf(newStatus.label, id)
        )

        return ok(
            mapOf(
                "success" to true,
                "message" to "Enquiry status updated to '${newStatus.label}'."
            )
        )
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Checks if the request carries a valid admin JWT.
     * The JwtAuthFilter already verified the token and stored role as a
     * request attribute; we just read it here.
     */
    private fun isAdmin(request: HttpServletRequest): Boolean =
        request.getAttribute("userRole") as? String == "admin"

    /** 200 OK helper */
    private fun ok(body: Map<String, Any?>): ResponseEntity<Map<String, Any?>> =
        ResponseEntity.ok(body)

    /** 400 Bad Request helper */
    private fun bad(message: String): ResponseEntity<Map<String, Any?>> =
        ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(mapOf("success" to false, "message" to message))
}
