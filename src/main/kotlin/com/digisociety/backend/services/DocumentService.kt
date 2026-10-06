package com.digisociety.backend.services

import com.digisociety.backend.models.Document
import com.digisociety.backend.models.DocumentResponse
import com.digisociety.backend.models.toResponse
import com.digisociety.backend.repositories.DocumentRepository
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.server.ResponseStatusException
import java.util.UUID

/**
 * DocumentService
 *
 * Owns the full document lifecycle: validation → S3 upload → PostgreSQL metadata.
 *
 * SECURITY:
 *   - societyId ALWAYS comes from JWT via SocietySecurityContext — never from frontend
 *   - Every findById / delete verifies document.societyId == jwt.societyId
 *   - S3 key format: societies/{societyId}/documents/{uuid}.{ext}
 *   - Atomicity: if S3 upload succeeds but DB fails → S3 object is cleaned up
 *   - Presigned URL generated only after ownership check
 *   - Never returns s3Key, localPath, or AWS internals to the caller
 */
@Service
class DocumentService(
    private val repo:      DocumentRepository,
    private val s3Service: S3Service
) {
    private val log = LoggerFactory.getLogger(DocumentService::class.java)

    @Value("\${app.s3.max-file-size-mb:10}")
    private var maxFileSizeMb: Long = 10L

    // ── Allowed file types — both extension AND MIME must match ──────────────
    companion object {
        private val ALLOWED_EXTENSIONS = setOf(
            "pdf", "doc", "docx", "xls", "xlsx", "csv",
            "jpg", "jpeg", "png", "webp"
        )
        private val ALLOWED_MIME_TYPES = setOf(
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/csv",
            "image/jpeg",
            "image/png",
            "image/webp"
        )
    }

    // ── Upload ────────────────────────────────────────────────────────────────

    /**
     * Full upload flow:
     * 1. Validate file extension
     * 2. Validate MIME type
     * 3. Validate file size
     * 4. Generate safe UUID-based filename (never use original name as key)
     * 5. Build society-scoped S3 key
     * 6. Upload to S3
     * 7. Save metadata to PostgreSQL
     * 8. If DB save fails → clean up S3 object (atomicity)
     *
     * societyId comes from the authenticated JWT — NEVER from request body.
     */
    fun upload(
        societyId: Long,
        uploadedBy: Long?,
        documentType: String,
        file: MultipartFile
    ): DocumentResponse {
        // 1. File must not be empty
        if (file.isEmpty)
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "File is empty.")

        // 2. Validate extension
        val originalName = file.originalFilename?.trim() ?: ""
        val ext = originalName.substringAfterLast(".", "").lowercase()
        if (ext !in ALLOWED_EXTENSIONS)
            throw ResponseStatusException(HttpStatus.BAD_REQUEST,
                "File type '.$ext' is not allowed. Allowed: ${ALLOWED_EXTENSIONS.joinToString()}")

        // 3. Validate MIME type — don't rely on extension alone
        val mimeType = file.contentType?.lowercase()?.substringBefore(";")?.trim() ?: ""
        if (mimeType !in ALLOWED_MIME_TYPES)
            throw ResponseStatusException(HttpStatus.BAD_REQUEST,
                "File MIME type '$mimeType' is not allowed.")

        // 4. Validate file size
        val maxBytes = maxFileSizeMb * 1024 * 1024
        if (file.size > maxBytes)
            throw ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                "File exceeds the maximum allowed size of ${maxFileSizeMb}MB.")

        // 5. Generate a safe UUID filename — original name NEVER becomes S3 key
        val uuid        = UUID.randomUUID().toString()
        val storedName  = "$uuid.$ext"

        // 6. Build society-scoped S3 key using societyId from JWT
        val s3Key = s3Service.buildKey(societyId, storedName)

        // 7. Upload to S3 first
        log.info("[DocumentService] Uploading doc societyId=$societyId ext=$ext size=${file.size}")
        s3Service.upload(societyId, storedName, mimeType, file.inputStream, file.size)

        // 8. Save metadata to PostgreSQL — if this fails, roll back S3 object
        return try {
            val doc = repo.save(Document(
                societyId        = societyId,       // from JWT — never frontend
                uploadedBy       = uploadedBy,
                originalFilename = originalName,
                storedFilename   = storedName,
                s3Key            = s3Key,
                contentType      = mimeType,
                fileSize         = file.size,
                documentType     = documentType.uppercase().trim().ifBlank { "GENERAL" },
                storageType      = "s3"
            ))
            log.info("[DocumentService] Saved doc id=${doc.id} societyId=$societyId key=$s3Key")
            doc.toResponse()
        } catch (e: Exception) {
            // Atomicity: DB failed → clean up the S3 object we just uploaded
            log.error("[DocumentService] DB save failed after S3 upload — rolling back S3 key=$s3Key")
            s3Service.tryDelete(s3Key)
            throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Document could not be saved. Please try again.")
        }
    }

    // ── List ─────────────────────────────────────────────────────────────────

    /**
     * Returns ONLY documents belonging to the authenticated society.
     * Frontend societyId is NEVER used here — societyId is from JWT.
     */
    fun findAll(societyId: Long): List<DocumentResponse> =
        repo.findAllBySocietyId(societyId).map { it.toResponse() }

    // ── Get with presigned URL ────────────────────────────────────────────────

    /**
     * Verifies document.societyId == jwtSocietyId before generating any presigned URL.
     * A user from Society A cannot download Society B's document by changing the ID.
     */
    data class DocumentWithUrl(val document: DocumentResponse, val downloadUrl: String)

    fun findByIdWithUrl(id: Long, societyId: Long): DocumentWithUrl {
        val doc = repo.findById(id).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found.")
        }

        // Society ownership check — critical isolation gate
        if (doc.societyId != societyId)
            throw ResponseStatusException(HttpStatus.FORBIDDEN,
                "Access denied: document does not belong to your society.")

        val s3Key = doc.s3Key
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND,
                "Document file not available.")

        // Generate presigned URL only after ownership verified
        val url = s3Service.generatePresignedUrl(s3Key)
        return DocumentWithUrl(doc.toResponse(), url)
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    /**
     * Delete flow:
     * 1. Find document in PostgreSQL
     * 2. Verify societyId ownership
     * 3. Delete S3 object
     * 4. Delete PostgreSQL metadata record
     * A user cannot delete another society's document by changing the ID.
     */
    fun delete(id: Long, societyId: Long) {
        val doc = repo.findById(id).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found.")
        }

        if (doc.societyId != societyId)
            throw ResponseStatusException(HttpStatus.FORBIDDEN,
                "Access denied: document does not belong to your society.")

        // Delete from S3 first
        doc.s3Key?.let { key ->
            s3Service.delete(key)
        }

        // Delete metadata from PostgreSQL
        repo.delete(doc)
        log.info("[DocumentService] Deleted doc id=$id societyId=$societyId")
    }
}
