package com.digisociety.backend.controllers

import com.digisociety.backend.models.SocietyRequest
import com.digisociety.backend.services.SocietyService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/societies")
class SocietyController(private val societyService: SocietyService) {

    @GetMapping
    fun getAll() = mapOf("success" to true, "data" to societyService.findAll())

    @PostMapping
    fun create(@RequestBody req: SocietyRequest): ResponseEntity<Any> {
        val s = societyService.create(req)
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(mapOf("success" to true, "message" to "Society created.", "data" to s))
    }

    @PutMapping("/{id}")
    fun update(@PathVariable id: Long, @RequestBody req: SocietyRequest) =
        mapOf("success" to true, "message" to "Society updated.", "data" to societyService.update(id, req))

    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: Long): ResponseEntity<Any> {
        societyService.delete(id)
        return ResponseEntity.ok(mapOf("success" to true, "message" to "Society deactivated."))
    }
}
