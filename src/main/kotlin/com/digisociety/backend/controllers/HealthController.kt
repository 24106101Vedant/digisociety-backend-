package com.digisociety.backend.controllers

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.Instant

@RestController
@RequestMapping("/api/health")
class HealthController {
    @GetMapping
    fun health() = mapOf(
        "success"   to true,
        "status"    to "ok",
        "service"   to "DigiSociety College Backend",
        "timestamp" to Instant.now().toString()
    )
}
