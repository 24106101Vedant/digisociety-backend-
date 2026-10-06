package com.digisociety.backend.controllers

import com.digisociety.backend.middleware.SocietySecurityContext
import com.digisociety.backend.services.CreateUserRequest
import com.digisociety.backend.services.UpdateUserRequest
import com.digisociety.backend.services.UserService
import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/users")
class UserController(
    private val userService: UserService,
    private val ctx: SocietySecurityContext
) {
    @GetMapping
    fun getAll(request: HttpServletRequest): Any {
        val sid = ctx.getSocietyId(request)   // null = super_admin sees all
        return mapOf("success" to true, "data" to userService.findAll(sid))
    }

    @GetMapping("/{id}")
    fun getOne(@PathVariable id: Long, request: HttpServletRequest): Any {
        val sid = ctx.getSocietyId(request)
        return mapOf("success" to true, "data" to userService.findById(id, sid))
    }

    @PostMapping
    fun create(@RequestBody req: CreateUserRequest, request: HttpServletRequest): ResponseEntity<Any> {
        // Always bind new user to the authenticated society
        val sid     = ctx.getSocietyId(request)
        val safeReq = if (sid != null) req.copy(societyId = sid) else req
        val user = userService.create(safeReq)
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(mapOf("success" to true, "message" to "User created.", "data" to user))
    }

    @PutMapping("/{id}")
    fun update(@PathVariable id: Long, @RequestBody req: UpdateUserRequest, request: HttpServletRequest): Any {
        val sid = ctx.getSocietyId(request)
        return mapOf("success" to true, "message" to "User updated.",
            "data" to userService.update(id, req, sid))
    }

    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: Long, request: HttpServletRequest): ResponseEntity<Any> {
        val requestingUserId = ctx.requireUserId(request)
        val sid              = ctx.getSocietyId(request)
        userService.deactivate(id, requestingUserId, sid)
        return ResponseEntity.ok(mapOf("success" to true, "message" to "User deactivated."))
    }
}
