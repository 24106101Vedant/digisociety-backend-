package com.digisociety.backend.config

import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Primary
import javax.sql.DataSource

/**
 * DataSourceConfig
 *
 * Handles two DATABASE_URL formats:
 *
 * 1. Render internal URL (injected automatically by Render):
 *    postgresql://user:password@host/dbname
 *
 * 2. Standard JDBC URL (used locally):
 *    jdbc:postgresql://host:5432/dbname
 *
 * In both cases, DB_USERNAME and DB_PASSWORD env vars override
 * credentials embedded in the URL (safer for Render).
 *
 * This replaces spring.datasource.url in application.properties
 * so the JDBC driver always gets the correct jdbc:postgresql:// format.
 */
@Configuration
class DataSourceConfig {

    private val log = LoggerFactory.getLogger(DataSourceConfig::class.java)

    @Bean
    @Primary
    fun dataSource(): DataSource {
        val rawUrl    = System.getenv("DATABASE_URL") ?: "jdbc:postgresql://localhost:5432/digisociety_college"
        val username  = System.getenv("DB_USERNAME")
        val password  = System.getenv("DB_PASSWORD") ?: ""

        // Convert Render raw URL to JDBC URL + extract embedded credentials
        val jdbcUrl: String
        var resolvedUser     = username
        var resolvedPassword = password

        if (rawUrl.startsWith("postgresql://") || rawUrl.startsWith("postgres://")) {
            // Render format: postgresql://user:pass@host/dbname
            // Convert to:    jdbc:postgresql://host/dbname
            val withoutScheme = rawUrl.removePrefix("postgresql://").removePrefix("postgres://")

            // Split user:pass@host/db
            val atIdx = withoutScheme.indexOf('@')
            if (atIdx != -1) {
                val credentialsPart = withoutScheme.substring(0, atIdx)
                val hostDbPart      = withoutScheme.substring(atIdx + 1)

                // Extract user/pass from credentials if not overridden by env vars
                val colonIdx = credentialsPart.indexOf(':')
                if (colonIdx != -1 && resolvedUser == null) {
                    resolvedUser     = credentialsPart.substring(0, colonIdx)
                    resolvedPassword = credentialsPart.substring(colonIdx + 1)
                } else if (resolvedUser == null) {
                    resolvedUser = credentialsPart
                }

                jdbcUrl = "jdbc:postgresql://$hostDbPart?sslmode=require"
            } else {
                // No credentials in URL
                jdbcUrl = "jdbc:postgresql://$withoutScheme?sslmode=require"
            }

            log.info("[DataSourceConfig] Converted Render URL to JDBC format")
        } else if (rawUrl.startsWith("jdbc:postgresql://")) {
            // Already correct JDBC format (local dev)
            jdbcUrl = rawUrl
            log.info("[DataSourceConfig] Using JDBC URL directly")
        } else {
            jdbcUrl = rawUrl
            log.warn("[DataSourceConfig] Unrecognised DATABASE_URL format — using as-is")
        }

        log.info("[DataSourceConfig] Connecting to: ${jdbcUrl.substringBefore("?")}")

        val config = HikariConfig().apply {
            this.jdbcUrl  = jdbcUrl
            this.username = resolvedUser
            this.password = resolvedPassword
            driverClassName = "org.postgresql.Driver"
            maximumPoolSize = 5
            minimumIdle     = 1
            connectionTimeout = 30_000
            idleTimeout       = 600_000
            maxLifetime       = 1_800_000
        }

        return HikariDataSource(config)
    }
}
