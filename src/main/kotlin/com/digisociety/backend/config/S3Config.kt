package com.digisociety.backend.config

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import software.amazon.awssdk.auth.credentials.EnvironmentVariableCredentialsProvider
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.presigner.S3Presigner

/**
 * S3Config
 *
 * Creates the AWS S3Client and S3Presigner beans.
 *
 * SECURITY:
 *   - Credentials are read EXCLUSIVELY from environment variables via
 *     EnvironmentVariableCredentialsProvider:
 *       AWS_ACCESS_KEY_ID
 *       AWS_SECRET_ACCESS_KEY
 *   - These values are NEVER hardcoded in source code.
 *   - They are NEVER written to application.properties.
 *   - They are NEVER returned in any API response or logged.
 *   - The frontend (React) NEVER receives or needs these values.
 *
 * Region and bucket name are non-secret config — safe in application.properties.
 */
@Configuration
class S3Config {

    private val log = LoggerFactory.getLogger(S3Config::class.java)

    @Value("\${app.s3.region:ap-south-1}")
    private lateinit var awsRegion: String

    @Value("\${app.s3.bucket:digisociety-college-docs}")
    lateinit var bucket: String

    @Bean
    fun s3Client(): S3Client {
        log.info("[S3Config] Initialising S3Client for region=$awsRegion bucket=$bucket")
        return S3Client.builder()
            .region(Region.of(awsRegion))
            // Reads AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY from env only
            .credentialsProvider(EnvironmentVariableCredentialsProvider.create())
            .build()
    }

    @Bean
    fun s3Presigner(): S3Presigner =
        S3Presigner.builder()
            .region(Region.of(awsRegion))
            .credentialsProvider(EnvironmentVariableCredentialsProvider.create())
            .build()
}
