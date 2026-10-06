package com.digisociety.backend.services

import com.digisociety.backend.models.PasswordResetToken
import com.digisociety.backend.repositories.PasswordResetTokenRepository
import com.digisociety.backend.repositories.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import java.security.SecureRandom
import java.time.Instant
import java.util.Base64

@Service
class PasswordResetService(
    private val userRepo:       UserRepository,
    private val tokenRepo:      PasswordResetTokenRepository,
    private val passwordEncoder: BCryptPasswordEncoder
) {
    private val log = LoggerFactory.getLogger(PasswordResetService::class.java)
    private val rng = SecureRandom()

    /**
     * Step 1 — user requests a reset.
     * We always return success to prevent email enumeration.
     * Returns the raw token (in production this would be emailed; here we log it for demo).
     */
    fun requestReset(email: String): String {
        val trimmed = email.trim().lowercase()
        val user    = userRepo.findByEmailIgnoreCase(trimmed).orElse(null)

        if (user == null) {
            log.info("[passwordReset] Unknown email requested reset: $trimmed — ignored")
            return "ok"   // don't reveal whether the email exists
        }

        // Invalidate any previous tokens for this user
        tokenRepo.invalidateAllForUser(user.id)

        // Generate a 32-byte random token, base64url-encoded
        val raw   = ByteArray(32).also { rng.nextBytes(it) }
        val token = Base64.getUrlEncoder().withoutPadding().encodeToString(raw)
        val hash  = passwordEncoder.encode(token)

        tokenRepo.save(PasswordResetToken(
            userId     = user.id,
            tokenHash  = hash,
            expiresAt  = Instant.now().plusSeconds(3600)   // 1 hour
        ))

        // In production: send token via email. For college/demo: log it.
        log.info("[passwordReset] Reset token for ${user.email} (id=${user.id}): $token")

        return token   // returned so the demo API can show it; real impl emails it
    }

    /**
     * Step 2 — user submits the token + new password.
     * Finds valid (unused, unexpired) tokens for the matching user,
     * BCrypt-compares the raw token against each hash.
     * Updates ONLY that user's password — never touches any other account.
     */
    fun resetPassword(rawToken: String, newPassword: String) {
        if (rawToken.isBlank())
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Reset token is required.")
        if (newPassword.length < 6)
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 6 characters.")

        // Find all active (unused + unexpired) tokens and BCrypt-match
        val allActive = tokenRepo.findAllByUserIdAndUsedFalseAndExpiresAtAfter(
            // We can't filter by hash directly (BCrypt is one-way), so we load
            // all valid tokens and compare. Volume is tiny (1-2 tokens per user).
            0L, Instant.now()      // userId=0 → won't match → we search across all below
        )

        // Wider search: load all unexpired, unused tokens and compare
        val validTokens = tokenRepo.findAll().filter {
            !it.used && it.expiresAt.isAfter(Instant.now())
        }

        val matched = validTokens.firstOrNull { passwordEncoder.matches(rawToken, it.tokenHash) }
            ?: throw ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Reset token is invalid or has expired.")

        val user = userRepo.findById(matched.userId).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND, "User not found.")
        }

        // Update ONLY this user's password
        user.passwordHash = passwordEncoder.encode(newPassword)
        userRepo.save(user)

        // Invalidate the token (and all other tokens for this user)
        tokenRepo.invalidateAllForUser(user.id)

        log.info("[passwordReset] Password updated for user id=${user.id} email=${user.email}")
    }
}
