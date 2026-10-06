package com.digisociety.backend.services

import com.digisociety.backend.models.User
import com.digisociety.backend.models.UserResponse
import com.digisociety.backend.models.toResponse
import com.digisociety.backend.repositories.UserRepository
import org.springframework.http.HttpStatus
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException

data class CreateUserRequest(
    val email: String = "", val password: String = "",
    val fullName: String = "", val role: String = "member",
    val mobile: String? = null, val societyId: Long? = null
)
data class UpdateUserRequest(
    val fullName: String? = null, val role: String? = null,
    val isActive: Boolean? = null, val password: String? = null,
    val mobile: String? = null
)

@Service
class UserService(
    private val userRepo: UserRepository,
    private val passwordEncoder: BCryptPasswordEncoder
) {
    private val validRoles = setOf("super_admin", "society_admin", "manager", "member", "staff")

    /** List users scoped to a society (super_admin can pass null to see all). */
    fun findAll(societyId: Long?): List<UserResponse> =
        if (societyId != null) userRepo.findAllBySocietyId(societyId).map { it.toResponse() }
        else userRepo.findAll().map { it.toResponse() }

    fun findById(id: Long, societyId: Long?): UserResponse {
        val user = userRepo.findById(id).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND, "User not found.")
        }
        if (societyId != null && user.societyId != societyId)
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied.")
        return user.toResponse()
    }

    fun create(req: CreateUserRequest): UserResponse {
        val email = req.email.trim().lowercase()
        if (email.isBlank() || req.password.isBlank())
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Email and password are required.")
        if (req.role !in validRoles)
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid role.")
        if (userRepo.existsByEmailIgnoreCase(email))
            throw ResponseStatusException(HttpStatus.CONFLICT, "A user with that email already exists.")

        return userRepo.save(User(
            email        = email,
            passwordHash = passwordEncoder.encode(req.password),
            fullName     = req.fullName.trim(),
            role         = req.role,
            mobile       = req.mobile,
            societyId    = req.societyId
        )).toResponse()
    }

    fun update(id: Long, req: UpdateUserRequest, societyId: Long?): UserResponse {
        val user = userRepo.findById(id).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND, "User not found.")
        }
        if (societyId != null && user.societyId != societyId)
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied.")
        req.fullName?.let { user.fullName = it.trim() }
        req.mobile?.let   { user.mobile   = it.trim() }
        req.role?.let {
            if (it !in validRoles) throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid role.")
            user.role = it
        }
        req.isActive?.let { user.isActive = it }
        req.password?.takeIf { it.isNotBlank() }?.let {
            user.passwordHash = passwordEncoder.encode(it)
        }
        return userRepo.save(user).toResponse()
    }

    fun deactivate(id: Long, requestingUserId: Long, societyId: Long?): UserResponse {
        if (id == requestingUserId)
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot deactivate your own account.")
        val user = userRepo.findById(id).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND, "User not found.")
        }
        if (societyId != null && user.societyId != societyId)
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied.")
        user.isActive = false
        return userRepo.save(user).toResponse()
    }
}
