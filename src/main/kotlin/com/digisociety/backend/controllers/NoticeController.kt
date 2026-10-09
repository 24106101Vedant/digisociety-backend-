package com.digisociety.backend.controllers

import com.digisociety.backend.middleware.SocietySecurityContext
import com.digisociety.backend.models.NoticeRequest
import com.digisociety.backend.models.NoticeUpdateRequest
import com.digisociety.backend.services.NoticeService
import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/notices")
class NoticeController(
    private val noticeService: NoticeService,
    private val ctx: SocietySecurityContext
) {
    @GetMapping
    fun getAll(request: HttpServletRequest): Any {
        val sid = ctx.requireSocietyId(request)
        return mapOf("success" to true, "data" to noticeService.findAll(sid))
    }

    @PostMapping
    fun create(@RequestBody req: NoticeRequest, request: HttpServletRequest): ResponseEntity<Any> {
        val sid      = ctx.requireSocietyId(request)
        val postedBy = ctx.getUserId(request)
        val n = noticeService.create(req, sid, postedBy)
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(mapOf("success" to true, "message" to "Notice posted.", "data" to n))
    }

    @PutMapping("/{id}")
    fun update(@PathVariable id: Long, @RequestBody req: NoticeUpdateRequest, request: HttpServletRequest): Any {
        val sid = ctx.requireSocietyId(request)
        return mapOf("success" to true, "message" to "Notice updated.",
            "data" to noticeService.update(id, req, sid))
    }

    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: Long, request: HttpServletRequest): ResponseEntity<Any> {
        val sid = ctx.requireSocietyId(request)
        noticeService.delete(id, sid)
        return ResponseEntity.ok(mapOf("success" to true, "message" to "Notice deleted."))
    }
}
