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
 * JwtAuthFilter.kt  ←  replaces  middleware/auth.js
 *
 * Reads the Bearer token from every inbound request, verifies it with
 * the JJWT library, and stores userId + userRole as request attributes
 * so downstream controllers can read them (mirrors req.user in Express).
 *
 * Demonstrates:
 *   • OOP       : class extending OncePerRequestFilter (inheritance),
 *                 companion object, private helper methods
 *   • Data types: String, Long, Boolean, nullable types (?)
 *   • Collections: setOf() — public routes whitelist
 *   • Inheritance: JwtAuthFilter extends Spring's OncePerRequestFilter
 */

package com.digisociety.backend.middleware

import io.jsonwebtoken.ExpiredJwtException
import io.jsonwebtoken.JwtException
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

// ── OOP: inheritance — extends OncePerRequestFilter (Spring Security) ─────────
@Component
class JwtAuthFilter : OncePerRequestFilter() {

    @Value("\${JWT_SECRET:DigisocietySecret123}")
    private lateinit var jwtSecret: String

    // ── OOP: companion object — constants & logger ────────────────────────────
    companion object {
        private val log = LoggerFactory.getLogger(JwtAuthFilter::class.java)

        /**
         * Routes that do NOT require a token.
         * Data type: Set<String> — O(1) lookup, immutable.
         * Mirrors the non-requireAuth routes in routes/auth.js and routes/enquiry.js.
         */
        private val PUBLIC_ROUTES: Set<String> = setOf(
            "/api/auth/register",
            "/api/auth/login",
            "/api/auth/forgot-password",
            "/api/enquiry",          // POST (public submit)
            "/api/health",
            "/"
        )

        /** HTTP methods that are always allowed without a token (pre-flight) */
        private val PUBLIC_METHODS: Set<String> = setOf("OPTIONS")
    }

    // ── OOP: override — required by OncePerRequestFilter ─────────────────────
    override fun doFilterInternal(
        request:  HttpServletRequest,
        response: HttpServletResponse,
        chain:    FilterChain
    ) {
        val path:   String = request.requestURI
        val method: String = request.method

        // ── Collections: Set.contains check ───────────────────────────────────
        if (method in PUBLIC_METHODS || isPublicRoute(path, method)) {
            chain.doFilter(request, response)
            return
        }

        // ── Data type: String? — nullable Bearer token ────────────────────────
        val token: String? = extractToken(request)

        if (token == null) {
            sendUnauthorized(response, "No token provided. Please log in.")
            return
        }

        // ── OOP: sealed-class-style result via when expression ────────────────
        when (val result = verifyToken(token)) {
            is TokenResult.Valid -> {
                // Store user info as request attributes for controllers
                request.setAttribute("userId",   result.userId)   // Data type: Long
                request.setAttribute("userRole", result.role)     // Data type: String
                chain.doFilter(request, response)
            }
            is TokenResult.Expired -> {
                sendUnauthorized(response, "Session expired. Please log in again.")
            }
            is TokenResult.Invalid -> {
                sendUnauthorized(response, "Invalid token. Please log in.")
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Checks if a path+method combination is public (no token needed).
     * POST /api/enquiry is public; GET /api/enquiry requires admin token.
     */
    private fun isPublicRoute(path: String, method: String): Boolean {
        if (path in PUBLIC_ROUTES) return true
        // POST /api/enquiry is public; other methods on that path are protected
        if (path == "/api/enquiry" && method == "POST") return true
        return false
    }

    /**
     * Extracts the JWT from the Authorization header.
     * Returns null if no valid Bearer token is present.
     * Data type: String? (nullable)
     */
    private fun extractToken(request: HttpServletRequest): String? {
        val authHeader: String = request.getHeader("Authorization") ?: return null
        return if (authHeader.startsWith("Bearer ")) authHeader.substring(7) else null
    }

    /**
     * Verifies the token and returns a typed TokenResult.
     * OOP: sealed class hierarchy below models the three outcomes.
     */
    private fun verifyToken(token: String): TokenResult {
        return try {
            val key    = Keys.hmacShaKeyFor(jwtSecret.toByteArray())
            val claims = Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .body

            // ── Data type: Long — user id stored as string subject in JWT ─────
            val userId: Long   = claims.subject.toLongOrNull() ?: 0L
            val role:   String = claims["role"] as? String ?: "member"

            TokenResult.Valid(userId = userId, role = role)
        } catch (e: ExpiredJwtException) {
            log.debug("[JWT] Token expired: ${e.message}")
            TokenResult.Expired
        } catch (e: JwtException) {
            log.debug("[JWT] Invalid token: ${e.message}")
            TokenResult.Invalid
        } catch (e: Exception) {
            log.warn("[JWT] Unexpected error verifying token: ${e.message}")
            TokenResult.Invalid
        }
    }

    /** Write a 401 JSON response without going through Spring's error handler */
    private fun sendUnauthorized(response: HttpServletResponse, message: String) {
        response.status      = HttpStatus.UNAUTHORIZED.value()
        response.contentType = "application/json"
        response.writer.write(
            """{"success":false,"message":"$message"}"""
        )
    }
}

// ── OOP: sealed class — models JWT verification outcomes ─────────────────────
/**
 * Sealed class hierarchy mirrors the three cases in the JS middleware:
 *   - token valid   → attach req.user
 *   - token expired → 401 "Session expired"
 *   - token invalid → 401 "Invalid token"
 */
sealed class TokenResult {
    /** Token is valid. Carries the parsed user ID and role. */
    data class Valid(
        val userId: Long,    // Data type: Long
        val role:   String   // Data type: String
    ) : TokenResult()

    /** Token signature is valid but it has expired. */
    object Expired : TokenResult()

    /** Token cannot be parsed or signature does not match. */
    object Invalid : TokenResult()
}
