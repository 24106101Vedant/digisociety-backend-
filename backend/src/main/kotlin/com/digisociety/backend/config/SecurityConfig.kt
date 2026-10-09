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
 * SecurityConfig.kt
 *
 * Spring Security + CORS configuration.
 * Equivalent to the cors() middleware setup in server.js and the
 * requireAuth middleware chain wired in the Express routers.
 *
 * Demonstrates:
 *   • OOP       : @Configuration class, Bean methods, companion object
 *   • Data types: String, Boolean, List<String>
 *   • Collections: listOf(), mutableListOf()
 */

package com.digisociety.backend.config

import com.digisociety.backend.middleware.JwtAuthFilter
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource

// ── OOP: @Configuration class — Spring bean factory ──────────────────────────
@Configuration
@EnableWebSecurity
class SecurityConfig(
    private val jwtAuthFilter: JwtAuthFilter
) {

    companion object {
        // ── Data type: List<String> — allowed origins (mirrors server.js) ─────
        private val ALLOWED_ORIGINS: List<String> = listOf(
            "http://localhost:5173",
            "http://localhost:4173",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:4173",
            "https://digisociety-6765e.web.app",
            "https://digisociety-6765e.firebaseapp.com",
            "https://digisociety.in",
            "https://www.digisociety.in"
        )

        // ── Collections: allowed HTTP methods ────────────────────────────────
        private val ALLOWED_METHODS: List<String> = listOf(
            "GET", "POST", "PUT", "DELETE", "OPTIONS"
        )

        // ── Collections: allowed headers ──────────────────────────────────────
        private val ALLOWED_HEADERS: List<String> = listOf(
            "Content-Type", "Authorization"
        )
    }

    /**
     * Main security filter chain.
     * Disables CSRF (stateless JWT API), sets session policy to STATELESS,
     * and registers the JwtAuthFilter before Spring's default auth filter.
     */
    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .csrf { it.disable() }
            .cors { it.configurationSource(corsConfigurationSource()) }
            .sessionManagement {
                it.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            }
            .authorizeHttpRequests { auth ->
                auth
                    // Public routes — no token required
                    .requestMatchers(
                        "/",
                        "/api/health",
                        "/api/auth/register",
                        "/api/auth/login",
                        "/api/auth/forgot-password"
                    ).permitAll()
                    // Everything else goes through JwtAuthFilter
                    .anyRequest().permitAll()
            }
            // Plug in our custom JWT filter
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter::class.java)

        return http.build()
    }

    /**
     * CORS configuration bean — mirrors the cors() middleware in server.js.
     * Data type: Boolean — allowCredentials
     * Collections: mutableListOf for origins (may be extended from env var)
     */
    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val config = CorsConfiguration()

        // ── Collections: build origins list, optionally append env var ────────
        val origins: MutableList<String> = mutableListOf(*ALLOWED_ORIGINS.toTypedArray())
        System.getenv("FRONTEND_URL")?.let { origins.add(it) }
        config.allowedOrigins = origins

        config.allowedMethods     = ALLOWED_METHODS
        config.allowedHeaders     = ALLOWED_HEADERS
        config.allowCredentials   = true    // Data type: Boolean

        val source = UrlBasedCorsConfigurationSource()
        source.registerCorsConfiguration("/**", config)
        return source
    }

    /**
     * Password encoder bean — BCrypt with strength 10.
     * Injected into AuthController and Application (for seeding admin).
     */
    @Bean
    fun passwordEncoder(): BCryptPasswordEncoder = BCryptPasswordEncoder(10)
}
