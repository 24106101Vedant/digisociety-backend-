package com.digisociety.backend.models

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "documents")
data class Document(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    // THE isolation key — must match the authenticated user's society_id from JWT
    @Column(name = "society_id", nullable = false)
    var societyId: Long = 0,

    @Column(name = "uploaded_by")
    var uploadedBy: Long? = null,

    // Human-readable name — for display only, NEVER used as an S3 key
    @Column(name = "original_filename", nullable = false)
    var originalFilename: String = "",

    // UUID-based filename — safe, no path traversal
    @Column(name = "stored_filename", nullable = false)
    var storedFilename: String = "",

    // Full S3 object key: societies/{societyId}/documents/{uuid}.{ext}
    // NULL while using local storage; set on successful S3 upload
    @Column(name = "s3_key")
    var s3Key: String? = null,

    @Column(name = "content_type")
    var contentType: String = "",

    @Column(name = "file_size", nullable = false)
    var fileSize: Long = 0,

    // "NOTICE" | "BILL" | "MEETING_MINUTES" | "GENERAL" | etc.
    @Column(name = "document_type", nullable = false)
    var documentType: String = "GENERAL",

    // "local" | "s3"
    @Column(name = "storage_type", nullable = false)
    var storageType: String = "s3",

    // Used only when storage_type = "local" (dev/testing without S3)
    @Column(name = "local_path")
    var localPath: String? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now()
)

/**
 * Safe response DTO.
 * NEVER includes: s3Key, localPath, AWS credentials, storage internals.
 */
data class DocumentResponse(
    val id: Long,
    val societyId: Long,
    val uploadedBy: Long?,
    val originalFilename: String,
    val contentType: String,
    val fileSize: Long,
    val documentType: String,
    val storageType: String,
    val createdAt: Instant
)

fun Document.toResponse() = DocumentResponse(
    id = id, societyId = societyId, uploadedBy = uploadedBy,
    originalFilename = originalFilename, contentType = contentType,
    fileSize = fileSize, documentType = documentType,
    storageType = storageType, createdAt = createdAt
)
