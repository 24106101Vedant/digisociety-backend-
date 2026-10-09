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

@Component
class JwtAuthFilter : OncePerRequestFilter() {

    @Value("\${app.jwt.secret:CollegeDigiSocietySecret2026}")
    private lateinit var jwtSecret: String

    companion object {
        private val log = LoggerFactory.getLogger(JwtAuthFilter::class.java)

        private val PUBLIC_ROUTES: Set<String> = setOf(
            "/api/auth/register",
            "/api/auth/login",
            "/api/auth/forgot-password",
            "/api/auth/reset-password",
            "/api/auth/send-otp",
            "/api/auth/verify-otp",
            "/api/health",
            "/"
        )
        private val PUBLIC_METHODS: Set<String> = setOf("OPTIONS")
    }

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        chain: FilterChain
    ) {
        val path   = request.requestURI
        val method = request.method

        if (method in PUBLIC_METHODS || isPublicRoute(path, method)) {
            chain.doFilter(request, response)
            return
        }

        val token = extractToken(request)
        if (token == null) {
            sendUnauthorized(response, "No token provided. Please log in.")
            return
        }

        when (val result = verifyToken(token)) {
            is TokenResult.Valid -> {
                // Set ALL identity fields — controllers use SocietySecurityContext to read them
                request.setAttribute("userId",    result.userId)
                request.setAttribute("societyId", result.societyId)   // key isolation field
                request.setAttribute("userRole",  result.role)
                chain.doFilter(request, response)
            }
            is TokenResult.Expired -> sendUnauthorized(response, "Session expired. Please log in again.")
            is TokenResult.Invalid -> sendUnauthorized(response, "Invalid token. Please log in.")
        }
    }

    private fun isPublicRoute(path: String, method: String): Boolean {
        if (path in PUBLIC_ROUTES) return true
        // POST /api/enquiry is the public landing-page form
        if (path == "/api/enquiry" && method == "POST") return true
        return false
    }

    private fun extractToken(request: HttpServletRequest): String? {
        val header = request.getHeader("Authorization") ?: return null
        return if (header.startsWith("Bearer ")) header.substring(7) else null
    }

    private fun verifyToken(token: String): TokenResult = try {
        val key    = Keys.hmacShaKeyFor(jwtSecret.toByteArray())
        val claims = Jwts.parserBuilder().setSigningKey(key).build()
                        .parseClaimsJws(token).body

        val userId    = claims.subject.toLongOrNull() ?: 0L
        val societyId = (claims["societyId"] as? Int)?.toLong()
                        ?: (claims["societyId"] as? Long)
        val role      = claims["role"] as? String ?: "society_admin"

        TokenResult.Valid(userId = userId, societyId = societyId, role = role)
    } catch (e: ExpiredJwtException) {
        log.debug("[JWT] Token expired")
        TokenResult.Expired
    } catch (e: JwtException) {
        log.debug("[JWT] Invalid token: ${e.message}")
        TokenResult.Invalid
    } catch (e: Exception) {
        log.warn("[JWT] Unexpected error: ${e.message}")
        TokenResult.Invalid
    }

    private fun sendUnauthorized(response: HttpServletResponse, message: String) {
        response.status      = HttpStatus.UNAUTHORIZED.value()
        response.contentType = "application/json"
        response.writer.write("""{"success":false,"message":"$message"}""")
    }
}

sealed class TokenResult {
    data class Valid(val userId: Long, val societyId: Long?, val role: String) : TokenResult()
    object Expired : TokenResult()
    object Invalid : TokenResult()
}
