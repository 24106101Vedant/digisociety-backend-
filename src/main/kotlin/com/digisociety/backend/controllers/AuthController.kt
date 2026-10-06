package com.digisociety.backend.controllers

import com.digisociety.backend.models.*
import com.digisociety.backend.services.AuthService
import com.digisociety.backend.services.PasswordResetService
import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val authService:          AuthService,
    private val passwordResetService: PasswordResetService
) {

    @PostMapping("/register")
    fun register(@RequestBody req: RegisterRequest): ResponseEntity<Any> {
        val user = authService.register(req)
        return ResponseEntity.status(HttpStatus.CREATED).body(
            mapOf("success" to true, "message" to "Account created successfully.", "data" to user)
        )
    }

    @PostMapping("/login")
    fun login(@RequestBody req: LoginRequest, request: HttpServletRequest): ResponseEntity<Any> {
        val result = authService.login(req, request)
        return ResponseEntity.ok(mapOf(
            "success" to true, "message" to "Login successful.",
            "token"   to result.token,
            "user"    to result.user
            // societyId is in the token — frontend reads it from the user object
        ))
    }

    @GetMapping("/me")
    fun me(request: HttpServletRequest): ResponseEntity<Any> {
        val userId = request.getAttribute("userId") as? Long
            ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(mapOf("success" to false, "message" to "Not authenticated."))
        return ResponseEntity.ok(mapOf("success" to true, "user" to authService.getMe(userId)))
    }

    @PostMapping("/logout")
    fun logout() = mapOf("success" to true, "message" to "Logged out successfully.")

    // ── Forgot Password — Step 1: request a reset token ──────────────────────
    @PostMapping("/forgot-password")
    fun forgotPassword(@RequestBody req: ForgotPasswordRequest): ResponseEntity<Any> {
        val email = req.email.trim()
        if (email.isBlank())
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(mapOf("success" to false, "message" to "Email is required."))

        // Always returns success to prevent email enumeration
        passwordResetService.requestReset(email)
        return ResponseEntity.ok(mapOf(
            "success" to true,
            "message" to "If that email is registered, a password reset link has been sent."
        ))
    }

    // ── Reset Password — Step 2: verify token + set new password ─────────────
    @PostMapping("/reset-password")
    fun resetPassword(@RequestBody req: ResetPasswordRequest): ResponseEntity<Any> {
        passwordResetService.resetPassword(req.token, req.newPassword)
        return ResponseEntity.ok(mapOf(
            "success" to true,
            "message" to "Password reset successfully. Please log in with your new password."
        ))
    }

    // OTP stubs preserved from frontend (POST /api/auth/send-otp etc.)
    @PostMapping("/send-otp")
    fun sendOtp(@RequestBody req: SendOtpRequest) =
        mapOf("success" to true, "message" to "If that email is registered, an OTP has been sent.")

    @PostMapping("/verify-otp")
    fun verifyOtp(@RequestBody req: VerifyOtpRequest) =
        mapOf("success" to false, "message" to "OTP verification not yet implemented.")
}
