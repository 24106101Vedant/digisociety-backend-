package com.digisociety.backend.services

import com.digisociety.backend.models.*
import com.digisociety.backend.repositories.LoginLogRepository
import com.digisociety.backend.repositories.UserRepository
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.SignatureAlgorithm
import io.jsonwebtoken.security.Keys
import jakarta.servlet.http.HttpServletRequest
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import java.time.Instant
import java.util.Date

@Service
class AuthService(
    private val userRepo:        UserRepository,
    private val logRepo:         LoginLogRepository,
    private val passwordEncoder: BCryptPasswordEncoder
) {
    private val log = LoggerFactory.getLogger(AuthService::class.java)
    private val emailRegex = Regex("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")

    @Value("\${app.jwt.secret:CollegeDigiSocietySecret2026}")
    private lateinit var jwtSecret: String

    @Value("\${app.jwt.expires-ms:28800000}")
    private var jwtExpiresMs: Long = 28_800_000L

    fun register(req: RegisterRequest): UserResponse {
        val name  = req.name.trim()
        val email = req.email.trim().lowercase()

        if (name.isBlank() || email.isBlank() || req.password.isBlank())
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Name, email, and password are required.")
        if (!emailRegex.matches(email))
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid email address.")
        if (req.password.length < 6)
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 6 characters.")
        if (userRepo.existsByEmailIgnoreCase(email))
            throw ResponseStatusException(HttpStatus.CONFLICT, "An account with that email already exists.")

        val user = userRepo.save(User(
            email        = email,
            passwordHash = passwordEncoder.encode(req.password),
            fullName     = name,
            mobile       = req.mobile?.trim(),
            societyId    = req.societyId
        ))
        log.info("[register] New user id=${user.id} societyId=${user.societyId}")
        return user.toResponse()
    }

    data class LoginResult(val token: String, val user: UserResponse)

    fun login(req: LoginRequest, request: HttpServletRequest): LoginResult {
        val email = req.email.trim().lowercase()
        if (email.isBlank() || req.password.isBlank())
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Email and password are required.")

        val user = userRepo.findByEmailIgnoreCase(email).orElse(null)
        if (user == null) {
            logAttempt(null, null, email, false, request)
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password.")
        }
        if (!user.isActive) {
            logAttempt(user.id, user.societyId, email, false, request)
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "Your account has been disabled. Please contact support.")
        }
        if (!passwordEncoder.matches(req.password, user.passwordHash)) {
            logAttempt(user.id, user.societyId, email, false, request)
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password.")
        }

        user.lastLogin = Instant.now()
        userRepo.save(user)
        logAttempt(user.id, user.societyId, email, true, request)

        // JWT includes societyId so the backend never trusts the frontend for isolation
        val token = generateToken(user.id, user.societyId, user.role)
        return LoginResult(token = token, user = user.toResponse())
    }

    fun getMe(userId: Long): UserResponse =
        userRepo.findById(userId).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND, "User not found.")
        }.toResponse()

    /**
     * Generate a JWT that carries:
     *   sub       = userId
     *   societyId = the user's societyId (null for super_admin)
     *   role      = the user's role
     *
     * The backend extracts societyId from the JWT on every request —
     * it is NEVER read from the frontend request body.
     */
    fun generateToken(userId: Long, societyId: Long?, role: String): String {
        val key     = Keys.hmacShaKeyFor(jwtSecret.toByteArray())
        val builder = Jwts.builder()
            .setSubject(userId.toString())
            .claim("role", role)
            .setIssuedAt(Date())
            .setExpiration(Date(System.currentTimeMillis() + jwtExpiresMs))
        if (societyId != null) builder.claim("societyId", societyId)
        return builder.signWith(key, SignatureAlgorithm.HS256).compact()
    }

    private fun logAttempt(
        userId: Long?, societyId: Long?, email: String,
        success: Boolean, request: HttpServletRequest
    ) {
        try {
            logRepo.save(LoginLog(
                userId    = userId,
                societyId = societyId,
                email     = email,
                success   = success,
                ipAddress = request.remoteAddr,
                userAgent = request.getHeader("User-Agent")
            ))
        } catch (e: Exception) {
            log.warn("[logAttempt] Failed: ${e.message}")
        }
    }
}
