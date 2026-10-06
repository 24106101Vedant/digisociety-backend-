package com.digisociety.backend.controllers

import com.digisociety.backend.middleware.SocietySecurityContext
import com.digisociety.backend.models.VisitorRequest
import com.digisociety.backend.models.VisitorUpdateRequest
import com.digisociety.backend.services.VisitorService
import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/visitors")
class VisitorController(
    private val visitorService: VisitorService,
    private val ctx: SocietySecurityContext
) {
    @GetMapping
    fun getAll(request: HttpServletRequest): Any {
        val sid = ctx.requireSocietyId(request)
        return mapOf("success" to true, "data" to visitorService.findAll(sid))
    }

    @PostMapping
    fun create(@RequestBody req: VisitorRequest, request: HttpServletRequest): ResponseEntity<Any> {
        val sid = ctx.requireSocietyId(request)
        val v = visitorService.create(req, sid)
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(mapOf("success" to true, "message" to "Visitor logged.", "data" to v))
    }

    @PutMapping("/{id}")
    fun update(@PathVariable id: Long, @RequestBody req: VisitorUpdateRequest, request: HttpServletRequest): Any {
        val sid = ctx.requireSocietyId(request)
        return mapOf("success" to true, "message" to "Visitor updated.",
            "data" to visitorService.update(id, req, sid))
    }

    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: Long, request: HttpServletRequest): ResponseEntity<Any> {
        val sid = ctx.requireSocietyId(request)
        visitorService.delete(id, sid)
        return ResponseEntity.ok(mapOf("success" to true, "message" to "Visitor record deleted."))
    }
}
