package com.digisociety.backend.controllers

import com.digisociety.backend.middleware.SocietySecurityContext
import com.digisociety.backend.services.DocumentService
import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile

/**
 * DocumentController
 *
 * SECURITY DESIGN:
 *   - All endpoints require a valid JWT (JwtAuthFilter enforces this)
 *   - societyId is ALWAYS read from the JWT via SocietySecurityContext
 *   - Frontend-supplied society_id in request body/params is NEVER trusted
 *   - Downloads use short-lived presigned S3 URLs — no direct S3 access
 *   - AWS credentials are NEVER returned in any response
 *   - Cross-society access is blocked at the service layer (document.societyId check)
 */
@RestController
@RequestMapping("/api/documents")
class DocumentController(
    private val documentService: DocumentService,
    private val ctx: SocietySecurityContext
) {

    // ── POST /api/documents/upload ────────────────────────────────────────────
    /**
     * Upload a document for the authenticated society.
     * societyId comes from JWT — frontend CANNOT override it.
     *
     * Form fields:
     *   file         — the file (multipart)
     *   documentType — optional category: NOTICE, BILL, MEETING_MINUTES, GENERAL
     */
    @PostMapping("/upload", consumes = ["multipart/form-data"])
    fun upload(
        @RequestParam("file")                              file:         MultipartFile,
        @RequestParam(defaultValue = "GENERAL")            documentType: String,
        request: HttpServletRequest
    ): ResponseEntity<Any> {
        val societyId  = ctx.requireSocietyId(request)   // from JWT — never frontend
        val uploadedBy = ctx.getUserId(request)

        val doc = documentService.upload(societyId, uploadedBy, documentType, file)
        return ResponseEntity.status(HttpStatus.CREATED).body(mapOf(
            "success"  to true,
            "message"  to "Document uploaded successfully.",
            "document" to doc
            // s3Key is NOT returned — internal only
        ))
    }

    // ── GET /api/documents ────────────────────────────────────────────────────
    /**
     * List all documents for the authenticated society only.
     * Equivalent to: WHERE society_id = jwt.societyId
     */
    @GetMapping
    fun getAll(request: HttpServletRequest): ResponseEntity<Any> {
        val societyId = ctx.requireSocietyId(request)
        val docs = documentService.findAll(societyId)
        return ResponseEntity.ok(mapOf(
            "success" to true,
            "total"   to docs.size,
            "data"    to docs
        ))
    }

    // ── GET /api/documents/{id} ───────────────────────────────────────────────
    /**
     * Get document metadata + a short-lived presigned download URL.
     *
     * Flow:
     *  1. Authenticate (JWT filter)
     *  2. Get jwt.societyId
     *  3. Load document from PostgreSQL
     *  4. Verify document.societyId == jwt.societyId  ← isolation check
     *  5. Generate presigned URL (expires in 15 min)
     *  6. Return metadata + URL — never AWS credentials
     */
    @GetMapping("/{id}")
    fun getOne(@PathVariable id: Long, request: HttpServletRequest): ResponseEntity<Any> {
        val societyId = ctx.requireSocietyId(request)
        val result    = documentService.findByIdWithUrl(id, societyId)

        return ResponseEntity.ok(mapOf(
            "success"     to true,
            "document"    to result.document,
            "downloadUrl" to result.downloadUrl,
            "expiresIn"   to "15 minutes"
            // No AWS credentials, no bucket name, no s3Key exposed
        ))
    }

    // ── DELETE /api/documents/{id} ────────────────────────────────────────────
    /**
     * Delete a document.
     *
     * Flow:
     *  1. Authenticate
     *  2. Get jwt.societyId
     *  3. Load document from PostgreSQL
     *  4. Verify document.societyId == jwt.societyId  ← isolation check
     *  5. Delete S3 object
     *  6. Delete PostgreSQL metadata
     */
    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: Long, request: HttpServletRequest): ResponseEntity<Any> {
        val societyId = ctx.requireSocietyId(request)
        documentService.delete(id, societyId)
        return ResponseEntity.ok(mapOf(
            "success" to true,
            "message" to "Document deleted successfully."
        ))
    }
}
