package com.digisociety.backend.services

import com.digisociety.backend.config.S3Config
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import software.amazon.awssdk.core.sync.RequestBody
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.model.*
import software.amazon.awssdk.services.s3.presigner.S3Presigner
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest
import java.io.InputStream
import java.time.Duration

/**
 * S3Service
 *
 * All operations are society-scoped.
 * The societyId in every S3 key comes from the JWT — never from the frontend.
 *
 * S3 key format: societies/{societyId}/documents/{storedFilename}
 *
 * SECURITY:
 *  - Bucket is PRIVATE — no public access
 *  - Downloads use short-lived presigned URLs only
 *  - AWS credentials never appear in responses, logs, or exceptions
 *  - Society isolation enforced at every operation
 */
@Service
class S3Service(
    private val s3Client:   S3Client,
    private val s3Presigner: S3Presigner,
    private val s3Config:   S3Config
) {
    private val log = LoggerFactory.getLogger(S3Service::class.java)

    @Value("\${app.s3.presigned-url-expiry-minutes:15}")
    private var presignedExpiryMinutes: Long = 15L

    /**
     * Build a society-scoped S3 object key.
     * societyId always comes from the authenticated user's JWT — never from request body.
     */
    fun buildKey(societyId: Long, storedFilename: String): String =
        "societies/$societyId/documents/$storedFilename"

    /**
     * Upload a file to S3 under the authenticated society's prefix.
     * Returns the S3 object key on success.
     * Throws ResponseStatusException(500) on S3 failure — safe message, no credentials exposed.
     */
    fun upload(
        societyId: Long,
        storedFilename: String,
        contentType: String,
        inputStream: InputStream,
        fileSize: Long
    ): String {
        val key = buildKey(societyId, storedFilename)
        log.info("[S3Service] Uploading key=$key size=$fileSize")

        return try {
            s3Client.putObject(
                PutObjectRequest.builder()
                    .bucket(s3Config.bucket)
                    .key(key)
                    .contentType(contentType)
                    .contentLength(fileSize)
                    .build(),
                RequestBody.fromInputStream(inputStream, fileSize)
            )
            log.info("[S3Service] Upload successful key=$key")
            key
        } catch (e: S3Exception) {
            log.error("[S3Service] Upload failed key=$key: ${e.message}")
            // Safe error — never expose credentials or bucket internals
            throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "File upload failed. Please try again.")
        }
    }

    /**
     * Generate a short-lived presigned GET URL.
     * ALWAYS verify document.societyId == jwt.societyId BEFORE calling this.
     * The presigned URL expires after `presignedExpiryMinutes` (default 15 min).
     */
    fun generatePresignedUrl(s3Key: String): String {
        log.info("[S3Service] Generating presigned URL for key=$s3Key expiry=${presignedExpiryMinutes}min")
        return try {
            val presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(presignedExpiryMinutes))
                .getObjectRequest(
                    GetObjectRequest.builder()
                        .bucket(s3Config.bucket)
                        .key(s3Key)
                        .build()
                )
                .build()

            s3Presigner.presignGetObject(presignRequest).url().toString()
        } catch (e: S3Exception) {
            log.error("[S3Service] Presign failed key=$s3Key: ${e.message}")
            throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Could not generate download link. Please try again.")
        }
    }

    /**
     * Delete an S3 object.
     * ALWAYS verify document.societyId == jwt.societyId BEFORE calling this.
     * Logs a warning if object doesn't exist (idempotent — don't fail).
     */
    fun delete(s3Key: String) {
        log.info("[S3Service] Deleting key=$s3Key")
        try {
            s3Client.deleteObject(
                DeleteObjectRequest.builder()
                    .bucket(s3Config.bucket)
                    .key(s3Key)
                    .build()
            )
            log.info("[S3Service] Deleted key=$s3Key")
        } catch (e: NoSuchKeyException) {
            log.warn("[S3Service] Key not found (already deleted?): $s3Key")
        } catch (e: S3Exception) {
            log.error("[S3Service] Delete failed key=$s3Key: ${e.message}")
            throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "File deletion failed. Please try again.")
        }
    }

    /**
     * Attempt to clean up an S3 object after a failed DB transaction.
     * Swallows all exceptions — called in finally blocks for atomicity.
     */
    fun tryDelete(s3Key: String) {
        try {
            delete(s3Key)
            log.info("[S3Service] Rollback cleanup: deleted key=$s3Key")
        } catch (e: Exception) {
            log.warn("[S3Service] Rollback cleanup failed for key=$s3Key: ${e.message}")
        }
    }
}
