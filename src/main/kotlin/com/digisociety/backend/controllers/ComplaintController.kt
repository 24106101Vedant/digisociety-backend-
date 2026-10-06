package com.digisociety.backend.controllers

import com.digisociety.backend.middleware.SocietySecurityContext
import com.digisociety.backend.models.ComplaintRequest
import com.digisociety.backend.models.ComplaintUpdateRequest
import com.digisociety.backend.services.ComplaintService
import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/complaints")
class ComplaintController(
    private val complaintService: ComplaintService,
    private val ctx: SocietySecurityContext
) {
    @GetMapping
    fun getAll(request: HttpServletRequest): Any {
        val sid = ctx.requireSocietyId(request)
        return mapOf("success" to true, "data" to complaintService.findAll(sid))
    }

    @GetMapping("/{id}")
    fun getOne(@PathVariable id: Long, request: HttpServletRequest): Any {
        val sid = ctx.requireSocietyId(request)
        return mapOf("success" to true, "data" to complaintService.findById(id, sid))
    }

    @PostMapping
    fun create(@RequestBody req: ComplaintRequest, request: HttpServletRequest): ResponseEntity<Any> {
        val sid = ctx.requireSocietyId(request)
        val c = complaintService.create(req, sid)
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(mapOf("success" to true, "message" to "Complaint submitted.", "data" to c))
    }

    @PutMapping("/{id}")
    fun update(@PathVariable id: Long, @RequestBody req: ComplaintUpdateRequest, request: HttpServletRequest): Any {
        val sid = ctx.requireSocietyId(request)
        return mapOf("success" to true, "message" to "Complaint updated.",
            "data" to complaintService.update(id, req, sid))
    }

    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: Long, request: HttpServletRequest): ResponseEntity<Any> {
        val sid = ctx.requireSocietyId(request)
        complaintService.delete(id, sid)
        return ResponseEntity.ok(mapOf("success" to true, "message" to "Complaint deleted."))
    }
}
