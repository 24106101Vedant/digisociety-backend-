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
 * S3Config.kt
 *
 * Spring @Configuration that exposes two beans:
 *   • S3Client       — for PutObject / DeleteObject operations
 *   • S3Presigner    — for generating time-limited presigned GET URLs
 *
 * Credentials are read from environment variables injected by Render:
 *   AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION
 *
 * Demonstrates:
 *   • OOP       : @Configuration class, @Bean factory methods
 *   • Data types: String (region, key, secret)
 */

package com.digisociety.backend.config

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.presigner.S3Presigner

// ── OOP: Spring configuration class ──────────────────────────────────────────
@Configuration
class S3Config {

    // ── Data type: String — injected from environment variables ───────────────
    @Value("\${AWS_ACCESS_KEY_ID}")
    private lateinit var accessKeyId: String

    @Value("\${AWS_SECRET_ACCESS_KEY}")
    private lateinit var secretAccessKey: String

    @Value("\${AWS_REGION:ap-south-1}")
    private lateinit var region: String

    /**
     * Shared credentials provider — built once, reused by both beans.
     * Uses StaticCredentialsProvider (appropriate for server-side keys).
     */
    private fun credentialsProvider(): StaticCredentialsProvider =
        StaticCredentialsProvider.create(
            AwsBasicCredentials.create(accessKeyId, secretAccessKey)
        )

    /**
     * S3Client bean — used for PutObject (upload) and DeleteObject.
     */
    @Bean
    fun s3Client(): S3Client = S3Client.builder()
        .region(Region.of(region))
        .credentialsProvider(credentialsProvider())
        .build()

    /**
     * S3Presigner bean — generates short-lived signed GET URLs so the
     * frontend can download private objects without exposing credentials.
     */
    @Bean
    fun s3Presigner(): S3Presigner = S3Presigner.builder()
        .region(Region.of(region))
        .credentialsProvider(credentialsProvider())
        .build()
}
