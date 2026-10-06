package com.digisociety.backend.middleware

import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component
import org.springframework.web.server.ResponseStatusException

/**
 * SocietySecurityContext
 *
 * The single, authoritative source of the authenticated society identity.
 * Controllers and services MUST use this — they must NEVER trust a
 * society_id supplied by the frontend in a request body or query param.
 *
 * The JwtAuthFilter sets two request attributes on every authenticated request:
 *   "userId"    → Long
 *   "societyId" → Long? (null for super_admin accounts)
 *   "userRole"  → String
 *
 * Usage:
 *   val sid = securityContext.requireSocietyId(request)
 *   // throws 403 if unauthenticated or no society bound to the token
 */
@Component
class SocietySecurityContext {

    /** Returns the authenticated user's ID or throws 401. */
    fun requireUserId(request: HttpServletRequest): Long =
        request.getAttribute("userId") as? Long
            ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated.")

    /**
     * Returns the authenticated society ID.
     * Throws 403 if the token has no society (super_admin calling a society endpoint).
     */
    fun requireSocietyId(request: HttpServletRequest): Long =
        request.getAttribute("societyId") as? Long
            ?: throw ResponseStatusException(HttpStatus.FORBIDDEN,
                "No society associated with this account for this operation.")

    /** Returns societyId or null (for super_admin endpoints that allow it). */
    fun getSocietyId(request: HttpServletRequest): Long? =
        request.getAttribute("societyId") as? Long

    fun getUserId(request: HttpServletRequest): Long? =
        request.getAttribute("userId") as? Long

    fun getRole(request: HttpServletRequest): String =
        request.getAttribute("userRole") as? String ?: ""

    fun isSuperAdmin(request: HttpServletRequest): Boolean =
        getRole(request) == "super_admin"

    fun isSocietyAdmin(request: HttpServletRequest): Boolean =
        getRole(request) in setOf("super_admin", "society_admin")
}
