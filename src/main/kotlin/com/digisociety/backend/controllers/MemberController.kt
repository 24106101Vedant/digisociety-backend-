package com.digisociety.backend.controllers

import com.digisociety.backend.middleware.SocietySecurityContext
import com.digisociety.backend.models.MemberRequest
import com.digisociety.backend.services.MemberService
import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/members")
class MemberController(
    private val memberService: MemberService,
    private val ctx: SocietySecurityContext
) {
    @GetMapping
    fun getAll(request: HttpServletRequest): Any {
        val sid = ctx.requireSocietyId(request)
        return mapOf("success" to true, "data" to memberService.findAll(sid))
    }

    @GetMapping("/{id}")
    fun getOne(@PathVariable id: Long, request: HttpServletRequest): Any {
        val sid = ctx.requireSocietyId(request)
        return mapOf("success" to true, "data" to memberService.findById(id, sid))
    }

    @PostMapping
    fun create(@RequestBody req: MemberRequest, request: HttpServletRequest): ResponseEntity<Any> {
        val sid = ctx.requireSocietyId(request)
        val m = memberService.create(req, sid)
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(mapOf("success" to true, "message" to "Member created.", "data" to m))
    }

    @PutMapping("/{id}")
    fun update(@PathVariable id: Long, @RequestBody req: MemberRequest, request: HttpServletRequest): Any {
        val sid = ctx.requireSocietyId(request)
        return mapOf("success" to true, "message" to "Member updated.",
            "data" to memberService.update(id, req, sid))
    }

    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: Long, request: HttpServletRequest): ResponseEntity<Any> {
        val sid = ctx.requireSocietyId(request)
        memberService.delete(id, sid)
        return ResponseEntity.ok(mapOf("success" to true, "message" to "Member deactivated."))
    }
}
