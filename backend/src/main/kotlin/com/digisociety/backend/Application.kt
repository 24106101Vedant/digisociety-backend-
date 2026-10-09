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
 * Application.kt
 *
 * Entry point for the DigiSociety Spring Boot backend.
 * Equivalent to server.js — boots the application, seeds the admin user,
 * and starts the embedded Tomcat server on the configured PORT.
 *
 * Demonstrates:
 *   • Kotlin main function & top-level functions
 *   • Data types  : String, Int, Boolean, Long
 *   • Collections : listOf(), mapOf()
 *   • OOP         : @SpringBootApplication marks the root Spring component-
 *                   scan class; CommandLineRunner is a SAM interface
 */

package com.digisociety.backend

import com.digisociety.backend.config.DatabaseConfig
import org.springframework.boot.CommandLineRunner
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.context.annotation.Bean
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder

// ── Kotlin OOP: class annotated with Spring stereotype ──────────────────────
@SpringBootApplication
class DigiSocietyApplication(
    private val db: DatabaseConfig,
    private val passwordEncoder: BCryptPasswordEncoder
) {

    /**
     * Runs once at startup — mirrors the boot-sequence IIFE in server.js.
     * Demonstrates: Kotlin lambdas, string templates, nullable types (?.)
     */
    @Bean
    fun seedAdmin(): CommandLineRunner = CommandLineRunner {

        // ── Data-type demo: typed constants ─────────────────────────────────
        val adminEmail:    String = (System.getenv("ADMIN_EMAIL")    ?: "digisociety.in@gmail.com").lowercase()
        val adminPassword: String =  System.getenv("ADMIN_PASSWORD") ?: "digisociety"
        val adminName:     String = "Vedant Kirtane"
        val adminRole:     String = "admin"

        // ── Collections demo: read existing user via map ─────────────────────
        val existing: Map<String, Any?>? = db.get(
            "SELECT id FROM users WHERE LOWER(email) = LOWER(?)",
            listOf(adminEmail)
        )

        if (existing == null) {
            val hash: String = passwordEncoder.encode(adminPassword)
            db.run(
                """INSERT INTO users (email, password, full_name, role, is_active)
                   VALUES (?, ?, ?, ?, 1)""",
                listOf(adminEmail, hash, adminName, adminRole)
            )
            println("✅  Admin user seeded → $adminEmail")
        } else {
            println("ℹ️   Admin user already exists (id=${existing["id"]}).")
        }

        // ── Collections demo: list of registered endpoints ───────────────────
        val endpoints: List<String> = listOf(
            "POST  /api/auth/register",
            "POST  /api/auth/login",
            "GET   /api/auth/me",
            "POST  /api/auth/logout",
            "POST  /api/auth/forgot-password",
            "POST  /api/enquiry",
            "GET   /api/enquiry          (admin)",
            "PUT   /api/enquiry/:id      (admin)",
            "GET   /api/admin/dashboard",
            "GET   /api/admin/users",
            "GET   /api/admin/login-logs",
            "GET   /api/health"
        )

        println("\n╔══════════════════════════════════════════╗")
        println("║   DigiSociety Backend API  🏢             ║")
        println("╚══════════════════════════════════════════╝")
        println("\n  Endpoints:")
        endpoints.forEach { println("  $it") }
        println()
    }
}

// ── Top-level main function (Kotlin equivalent of Node's process start) ──────
fun main(args: Array<String>) {
    runApplication<DigiSocietyApplication>(*args)
}
