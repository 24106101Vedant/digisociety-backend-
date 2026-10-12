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
 * DocumentService.kt
 *
 * Service layer for document management backed by Amazon S3 + SQLite.
 *
 * Responsibilities:
 *   1. uploadDocument()     — stream a multipart file into S3, persist metadata to DB
 *   2. getPresignedUrl()    — generate a short-lived signed GET URL for a private object
 *   3. deleteDocument()     — remove from S3 and delete DB row
 *   4. listDocuments()      — fetch document metadata rows for a given owner / category
 *
 * S3 key layout:
 *   documents/<userId>/<category>/<uuid>_<originalFilename>
 *
 * Demonstrates:
 *   • OOP       : @Service class, constructor injection, data class DocumentMeta
 *   • Data types: String, Long, ByteArray, nullable types (?)
 *   • Collections: List<Map<String,Any?>>, mutableListOf, filter, map
 *   • Exception handling: try/catch wrapping AWS SDK calls
 */

package com.digisociety.backend.services

import com.digisociety.backend.config.DatabaseConfig
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider
import software.amazon.awssdk.core.sync.RequestBody
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest
import software.amazon.awssdk.services.s3.model.GetObjectRequest
import software.amazon.awssdk.services.s3.model.PutObjectRequest
import software.amazon.awssdk.services.s3.presigner.S3Presigner
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest
import java.time.Duration
import java.util.UUID

// ── OOP: data class for upload result ────────────────────────────────────────
data class DocumentMeta(
    val id:           Long,
    val userId:       Long,
    val category:     String,
    val originalName: String,
    val s3Key:        String,
    val contentType:  String,
    val sizeBytes:    Long,
    val uploadedAt:   String
)

// ── OOP: Spring service component ────────────────────────────────────────────
@Service
class DocumentService(
    private val s3Client: S3Client,
    private val db:       DatabaseConfig
) {

    companion object {
        private val log = LoggerFactory.getLogger(DocumentService::class.java)

        private const val PRESIGN_MINUTES: Long = 15L

        private val ALLOWED_TYPES: Set<String> = setOf(
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/webp",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            // Excel
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            // CSV & plain text
            "text/csv",
            "text/plain"
        )

        private const val MAX_SIZE_BYTES: Long = 10 * 1024 * 1024L
    }

    @Value("\${AWS_S3_BUCKET}")
    private lateinit var bucket: String

    @Value("\${AWS_ACCESS_KEY_ID}")
    private lateinit var accessKeyId: String

    @Value("\${AWS_SECRET_ACCESS_KEY}")
    private lateinit var secretAccessKey: String

    @Value("\${AWS_REGION:ap-south-1}")
    private lateinit var region: String

    // ─────────────────────────────────────────────────────────────────────────
    // uploadDocument()
    // ─────────────────────────────────────────────────────────────────────────
    /**
     * Validates, uploads to S3, and persists metadata to SQLite.
     * Returns the saved DocumentMeta on success.
     *
     * OOP       : throws IllegalArgumentException for bad input (exception handling)
     * Data type : String (S3 key, content type), Long (file size, user id)
     */
    fun uploadDocument(
        file:     MultipartFile,
        userId:   Long,
        category: String
    ): DocumentMeta {

        // ── Exception handling: input validation ──────────────────────────────
        val contentType: String = file.contentType ?: "application/octet-stream"
        if (contentType !in ALLOWED_TYPES) {
            throw IllegalArgumentException(
                "File type not allowed. Permitted: PDF, JPEG, PNG, WEBP, DOC, DOCX, XLS, XLSX, CSV."
            )
        }
        if (file.size > MAX_SIZE_BYTES) {
            throw IllegalArgumentException("File exceeds maximum size of 10 MB.")
        }

        val safeCategory: String = category.trim().lowercase().replace(Regex("[^a-z0-9_-]"), "_")
        val originalName: String = file.originalFilename ?: "upload"

        // ── Data type: String — unique S3 object key ──────────────────────────
        val s3Key: String = "documents/$userId/$safeCategory/${UUID.randomUUID()}_$originalName"

        // ── Exception handling: S3 upload ─────────────────────────────────────
        try {
            val putRequest: PutObjectRequest = PutObjectRequest.builder()
                .bucket(bucket)
                .key(s3Key)
                .contentType(contentType)
                .contentLength(file.size)
                .build()

            s3Client.putObject(putRequest, RequestBody.fromInputStream(file.inputStream, file.size))
            log.info("✅  Uploaded to S3: $s3Key")
        } catch (e: Exception) {
            log.error("❌  S3 upload failed: ${e.message}")
            throw RuntimeException("Document upload failed: ${e.message}", e)
        }

        // ── Persist metadata to SQLite ────────────────────────────────────────
        val meta = db.run(
            """INSERT INTO documents (user_id, category, original_name, s3_key, content_type, size_bytes)
               VALUES (?, ?, ?, ?, ?, ?)""",
            listOf(userId, safeCategory, originalName, s3Key, contentType, file.size)
        )

        return DocumentMeta(
            id           = meta["lastInsertRowid"] ?: 0L,
            userId       = userId,
            category     = safeCategory,
            originalName = originalName,
            s3Key        = s3Key,
            contentType  = contentType,
            sizeBytes    = file.size,
            uploadedAt   = java.time.Instant.now().toString()
        )
    }

    // ─────────────────────────────────────────────────────────────────────────
    // getPresignedUrl()
    // ─────────────────────────────────────────────────────────────────────────
    /**
     * Generates a presigned GET URL valid for PRESIGN_MINUTES minutes.
     * The frontend uses this URL to download/display the file directly from S3
     * without exposing AWS credentials.
     *
     * Data type: String (presigned URL), Duration (expiry)
     */
    fun getPresignedUrl(documentId: Long, requestingUserId: Long, isAdmin: Boolean): String {
        val row = db.get("SELECT * FROM documents WHERE id = ?", listOf(documentId))
            ?: throw NoSuchElementException("Document not found.")

        val ownerId = (row["user_id"] as? Long) ?: (row["user_id"] as? Int)?.toLong() ?: 0L

        if (!isAdmin && ownerId != requestingUserId) {
            throw SecurityException("Access denied.")
        }

        val s3Key: String = row["s3_key"] as String

        val presigner: S3Presigner = S3Presigner.builder()
            .region(Region.of(region))
            .credentialsProvider(
                StaticCredentialsProvider.create(
                    AwsBasicCredentials.create(accessKeyId, secretAccessKey)
                )
            )
            .build()

        val presignRequest: GetObjectPresignRequest = GetObjectPresignRequest.builder()
            .signatureDuration(Duration.ofMinutes(PRESIGN_MINUTES))
            .getObjectRequest(
                GetObjectRequest.builder()
                    .bucket(bucket)
                    .key(s3Key)
                    .build()
            )
            .build()

        return presigner.presignGetObject(presignRequest).url().toString()
    }

    // ─────────────────────────────────────────────────────────────────────────
    // deleteDocument()
    // ─────────────────────────────────────────────────────────────────────────
    /**
     * Deletes the S3 object then removes the DB row.
     * OOP: exception handling — S3 errors are caught and rethrown with context.
     */
    fun deleteDocument(documentId: Long, requestingUserId: Long, isAdmin: Boolean) {
        val row = db.get("SELECT * FROM documents WHERE id = ?", listOf(documentId))
            ?: throw NoSuchElementException("Document not found.")

        val ownerId = (row["user_id"] as? Long) ?: (row["user_id"] as? Int)?.toLong() ?: 0L
        if (!isAdmin && ownerId != requestingUserId) {
            throw SecurityException("Access denied.")
        }

        val s3Key: String = row["s3_key"] as String

        // ── Exception handling: S3 delete ─────────────────────────────────────
        try {
            s3Client.deleteObject(
                DeleteObjectRequest.builder().bucket(bucket).key(s3Key).build()
            )
            log.info("✅  Deleted from S3: $s3Key")
        } catch (e: Exception) {
            log.error("❌  S3 delete failed: ${e.message}")
            throw RuntimeException("Document deletion failed: ${e.message}", e)
        }

        db.run("DELETE FROM documents WHERE id = ?", listOf(documentId))
    }

    // ─────────────────────────────────────────────────────────────────────────
    // listDocuments()
    // ─────────────────────────────────────────────────────────────────────────
    /**
     * Returns all document metadata rows.
     * Admins see all; members see only their own.
     *
     * Collections: List<Map<String,Any?>> — DB result set
     * Data type  : String? (optional category filter)
     */
    fun listDocuments(
        requestingUserId: Long,
        isAdmin:          Boolean,
        category:         String? = null
    ): List<Map<String, Any?>> {

        // ── Collections: build dynamic SQL ────────────────────────────────────
        val conditions: MutableList<String> = mutableListOf()
        val params:     MutableList<Any?>   = mutableListOf()

        if (!isAdmin) {
            conditions.add("user_id = ?")
            params.add(requestingUserId)
        }
        category?.let {
            conditions.add("category = ?")
            params.add(it.trim().lowercase())
        }

        val where: String = if (conditions.isEmpty()) "" else "WHERE ${conditions.joinToString(" AND ")}"

        return db.all(
            "SELECT id, user_id, category, original_name, content_type, size_bytes, uploaded_at FROM documents $where ORDER BY uploaded_at DESC",
            params
        )
    }
}
