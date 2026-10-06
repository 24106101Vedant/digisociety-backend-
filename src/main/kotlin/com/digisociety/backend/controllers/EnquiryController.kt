package com.digisociety.backend.controllers

import com.digisociety.backend.models.CreateEnquiryRequest
import com.digisociety.backend.models.UpdateEnquiryStatusRequest
import com.digisociety.backend.services.EnquiryService
import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/enquiry")
class EnquiryController(private val enquiryService: EnquiryService) {

    @PostMapping
    fun create(@RequestBody req: CreateEnquiryRequest): ResponseEntity<Any> {
        enquiryService.create(req)
        return ResponseEntity.status(HttpStatus.CREATED).body(
            mapOf("success" to true, "message" to "Enquiry submitted successfully. We will contact you soon.")
        )
    }

    @GetMapping
    fun getAll(
        @RequestParam(required = false) status: String?,
        request: HttpServletRequest
    ): ResponseEntity<Any> {
        val role = request.getAttribute("userRole") as? String
        if (role != "admin")
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(mapOf("success" to false, "message" to "Admin access required."))
        val list = enquiryService.findAll(status)
        return ResponseEntity.ok(mapOf("success" to true, "data" to list, "total" to list.size))
    }

    @PutMapping("/{id}")
    fun updateStatus(
        @PathVariable id: Long,
        @RequestBody req: UpdateEnquiryStatusRequest,
        request: HttpServletRequest
    ): ResponseEntity<Any> {
        val role = request.getAttribute("userRole") as? String
        if (role != "admin")
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(mapOf("success" to false, "message" to "Admin access required."))
        val updated = enquiryService.updateStatus(id, req)
        return ResponseEntity.ok(mapOf("success" to true,
            "message" to "Status updated to '${updated.status}'.", "data" to updated))
    }
}
