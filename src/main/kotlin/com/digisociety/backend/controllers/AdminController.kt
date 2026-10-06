package com.digisociety.backend.controllers

import com.digisociety.backend.middleware.SocietySecurityContext
import com.digisociety.backend.services.AdminService
import com.digisociety.backend.services.CreateUserRequest
import com.digisociety.backend.services.UpdateUserRequest
import com.digisociety.backend.services.UserService
import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/admin")
class AdminController(
    private val adminService: AdminService,
    private val userService:  UserService,
    private val ctx:          SocietySecurityContext
) {
    /** Only super_admin or society_admin may access admin endpoints. */
    private fun guardAdmin(request: HttpServletRequest): ResponseEntity<Any>? {
        if (!ctx.isSocietyAdmin(request))
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(mapOf("success" to false, "message" to "Admin access required."))
        return null
    }

    @GetMapping("/dashboard")
    fun dashboard(request: HttpServletRequest): ResponseEntity<Any> {
        guardAdmin(request)?.let { return it }
        // Super admin sees platform dashboard; society admin sees own society
        val data = if (ctx.isSuperAdmin(request)) adminService.dashboard()
                   else adminService.societyDashboard(ctx.requireSocietyId(request))
        return ResponseEntity.ok(mapOf("success" to true, "data" to data))
    }

    @GetMapping("/users")
    fun getUsers(request: HttpServletRequest): ResponseEntity<Any> {
        guardAdmin(request)?.let { return it }
        val sid = ctx.getSocietyId(request)   // null for super_admin = all users
        return ResponseEntity.ok(mapOf("success" to true, "data" to userService.findAll(sid)))
    }

    @GetMapping("/users/{id}")
    fun getUser(@PathVariable id: Long, request: HttpServletRequest): ResponseEntity<Any> {
        guardAdmin(request)?.let { return it }
        val sid = ctx.getSocietyId(request)
        return ResponseEntity.ok(mapOf("success" to true, "data" to userService.findById(id, sid)))
    }

    @PostMapping("/users")
    fun createUser(@RequestBody req: CreateUserRequest, request: HttpServletRequest): ResponseEntity<Any> {
        guardAdmin(request)?.let { return it }
        // Society admin can only create users within their own society
        val sid = ctx.getSocietyId(request)
        val safeReq = if (sid != null) req.copy(societyId = sid) else req
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(mapOf("success" to true, "message" to "User created.",
                        "data" to userService.create(safeReq)))
    }

    @PutMapping("/users/{id}")
    fun updateUser(@PathVariable id: Long, @RequestBody req: UpdateUserRequest, request: HttpServletRequest): ResponseEntity<Any> {
        guardAdmin(request)?.let { return it }
        val sid = ctx.getSocietyId(request)
        return ResponseEntity.ok(mapOf("success" to true, "message" to "User updated.",
            "data" to userService.update(id, req, sid)))
    }

    @DeleteMapping("/users/{id}")
    fun deleteUser(@PathVariable id: Long, request: HttpServletRequest): ResponseEntity<Any> {
        guardAdmin(request)?.let { return it }
        val requestingUserId = ctx.requireUserId(request)
        val sid              = ctx.getSocietyId(request)
        userService.deactivate(id, requestingUserId, sid)
        return ResponseEntity.ok(mapOf("success" to true, "message" to "User deactivated."))
    }

    @GetMapping("/login-logs")
    fun loginLogs(@RequestParam(defaultValue = "50") limit: Int, request: HttpServletRequest): ResponseEntity<Any> {
        guardAdmin(request)?.let { return it }
        return ResponseEntity.ok(mapOf("success" to true, "data" to adminService.loginLogs(limit)))
    }

    @GetMapping("/society-analytics")
    fun analytics(request: HttpServletRequest): ResponseEntity<Any> {
        guardAdmin(request)?.let { return it }
        return ResponseEntity.ok(mapOf("success" to true, "data" to adminService.societyAnalytics()))
    }
}
