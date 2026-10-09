package com.digisociety.backend

import com.digisociety.backend.models.User
import com.digisociety.backend.repositories.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.boot.CommandLineRunner
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.context.annotation.Bean
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder

@SpringBootApplication
class DigiSocietyApplication(
    private val userRepo:        UserRepository,
    private val passwordEncoder: BCryptPasswordEncoder
) {
    private val log = LoggerFactory.getLogger(DigiSocietyApplication::class.java)

    @Bean
    fun seedAdmin(): CommandLineRunner = CommandLineRunner {
        val adminEmail    = (System.getenv("ADMIN_EMAIL")    ?: "admin@college.digisociety.in").lowercase()
        val adminPassword =  System.getenv("ADMIN_PASSWORD") ?: "changeme123"

        if (!userRepo.existsByEmailIgnoreCase(adminEmail)) {
            userRepo.save(User(
                email        = adminEmail,
                passwordHash = passwordEncoder.encode(adminPassword),
                fullName     = "DigiSociety Admin",
                role         = "super_admin",
                societyId    = null   // super_admin has no society
            ))
            log.info("✅  Super admin seeded → $adminEmail")
        } else {
            log.info("ℹ️   Admin already exists: $adminEmail")
        }

        log.info("""
╔══════════════════════════════════════════════╗
║  DigiSociety College Backend  🏢              ║
║  Multi-Society Isolation: ENABLED            ║
╚══════════════════════════════════════════════╝
  Society ID flows: JWT → SocietySecurityContext → Service → DB
  Password storage: BCrypt only — never plain text
  S3 key format:    societies/{id}/documents/{uuid}.{ext}
        """.trimIndent())
    }
}

fun main(args: Array<String>) {
    runApplication<DigiSocietyApplication>(*args)
}
