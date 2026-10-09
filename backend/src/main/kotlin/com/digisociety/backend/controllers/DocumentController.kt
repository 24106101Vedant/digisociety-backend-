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
 * DocumentController.kt  —  REST API for document management via Amazon S3
 *
 * Endpoints (all require valid JWT):
 *   POST   /api/documents/upload          – upload a file to S3
 *   GET    /api/documents                 – list documents (own; admin sees all)
 *   GET    /api/documents/{id}/url        – get a presigned download URL (15 min)
 *   DELETE /api/documents/{id}            – delete document from S3 + DB
 *
 * Demonstrates:
 *   • OOP       : @RestController class, constructor injection, private helpers
 *   • Data types: String, Long, Boolean, nullable types (?)
 *   • Collections: mapOf(), List<Map<String,Any?>>
 *   • Exception handling: try/catch mapping service exceptions to HTTP responses
 */

package com.digisociety.backend.controllers

import com.digisociety.backend.services.DocumentService
import jakarta.servlet.http.HttpServletRequest
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile

// ── OOP: Spring REST controller ───────────────────────────────────────────────
@RestController
@RequestMapping("/api/documents")
class DocumentController(
    private val documentService: DocumentService
) {

    companion object {
        private val log = LoggerFactory.getLogger(DocumentController::class.java)
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/documents/upload
    // multipart/form-data: file + category
    // ─────────────────────────────────────────────────────────────────────────
    /**
     * Upload a document to S3.
     * OOP       : delegates to DocumentService, catches service exceptions
     * Data type : MultipartFile (binary), String (category), Long (userId)
     */
    @PostMapping("/upload", consumes = ["multipart/form-data"])
    fun upload(
        @RequestPart("file")                      file:     MultipartFile,
        @RequestParam("category", defaultValue = "general") category: String,
        request: HttpServletRequest
    ): ResponseEntity<Map<String, Any?>> {

        val userId: Long = extractUserId(request) ?: return unauthorized()

        // ── Exception handling: delegate to service, map errors to HTTP ───────
        return try {
            val meta = documentService.uploadDocument(file, userId, category)
            ResponseEntity.status(HttpStatus.CREATED).body(
                mapOf(
                    "success" to true,
                    "message" to "Document uploaded successfully.",
                    "data"    to mapOf(
                        "id"           to meta.id,
                        "category"     to meta.category,
                        "originalName" to meta.originalName,
                        "contentType"  to meta.contentType,
                        "sizeBytes"    to meta.sizeBytes,
                        "uploadedAt"   to meta.uploadedAt
                    )
                )
            )
        } catch (e: IllegalArgumentException) {
            log.warn("Upload validation failed: ${e.message}")
            bad(e.message ?: "Invalid request.")
        } catch (e: RuntimeException) {
            log.error("Upload error: ${e.message}")
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(mapOf("success" to false, "message" to (e.message ?: "Upload failed.")))
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/documents?category=<optional>
    // ─────────────────────────────────────────────────────────────────────────
    /**
     * List documents. Admins see all; members see only their own.
     * Collections: List<Map<String,Any?>> from DocumentService
     */
    @GetMapping
    fun list(
        @RequestParam("category", required = false) category: String?,
        request: HttpServletRequest
    ): ResponseEntity<Map<String, Any?>> {

        val userId:  Long    = extractUserId(request)  ?: return unauthorized()
        val isAdmin: Boolean = extractRole(request) == "admin"

        val docs = documentService.listDocuments(userId, isAdmin, category)
        return ok(mapOf("success" to true, "data" to docs))
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/documents/{id}/url
    // ─────────────────────────────────────────────────────────────────────────
    /**
     * Generate a 15-minute presigned S3 GET URL.
     * Data type: String (URL), Long (documentId)
     */
    @GetMapping("/{id}/url")
    fun presignedUrl(
        @PathVariable id: Long,
        request: HttpServletRequest
    ): ResponseEntity<Map<String, Any?>> {

        val userId:  Long    = extractUserId(request)  ?: return unauthorized()
        val isAdmin: Boolean = extractRole(request) == "admin"

        return try {
            val url: String = documentService.getPresignedUrl(id, userId, isAdmin)
            ok(mapOf("success" to true, "data" to mapOf("url" to url, "expiresInMinutes" to 15)))
        } catch (e: NoSuchElementException) {
            notFound(e.message ?: "Document not found.")
        } catch (e: SecurityException) {
            ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(mapOf("success" to false, "message" to "Access denied."))
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DELETE /api/documents/{id}
    // ─────────────────────────────────────────────────────────────────────────
    /**
     * Delete a document from S3 and the database.
     * Exception handling: NoSuchElementException → 404, SecurityException → 403
     */
    @DeleteMapping("/{id}")
    fun delete(
        @PathVariable id: Long,
        request: HttpServletRequest
    ): ResponseEntity<Map<String, Any?>> {

        val userId:  Long    = extractUserId(request)  ?: return unauthorized()
        val isAdmin: Boolean = extractRole(request) == "admin"

        return try {
            documentService.deleteDocument(id, userId, isAdmin)
            ok(mapOf("success" to true, "message" to "Document deleted successfully."))
        } catch (e: NoSuchElementException) {
            notFound(e.message ?: "Document not found.")
        } catch (e: SecurityException) {
            ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(mapOf("success" to false, "message" to "Access denied."))
        } catch (e: RuntimeException) {
            log.error("Delete error: ${e.message}")
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(mapOf("success" to false, "message" to (e.message ?: "Deletion failed.")))
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers — mirror the pattern in AdminController
    // ─────────────────────────────────────────────────────────────────────────

    /** Extract userId set by JwtAuthFilter; returns null if not authenticated. */
    private fun extractUserId(request: HttpServletRequest): Long? =
        request.getAttribute("userId") as? Long

    /** Extract role set by JwtAuthFilter. */
    private fun extractRole(request: HttpServletRequest): String? =
        request.getAttribute("userRole") as? String

    private fun ok(body: Map<String, Any?>): ResponseEntity<Map<String, Any?>> =
        ResponseEntity.ok(body)

    private fun bad(message: String): ResponseEntity<Map<String, Any?>> =
        ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(mapOf("success" to false, "message" to message))

    private fun notFound(message: String): ResponseEntity<Map<String, Any?>> =
        ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(mapOf("success" to false, "message" to message))

    private fun unauthorized(): ResponseEntity<Map<String, Any?>> =
        ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(mapOf("success" to false, "message" to "Authentication required."))
}
