package com.digisociety.backend.services

import com.digisociety.backend.models.*
import com.digisociety.backend.repositories.EnquiryRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException

@Service
class EnquiryService(private val repo: EnquiryRepository) {

    private val emailRegex = Regex("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")

    fun create(req: CreateEnquiryRequest): Enquiry {
        val societyName  = req.society_name.trim()
        val chairmanName = req.chairman_name.trim()
        val email        = req.email.trim().lowercase()
        val mobile       = req.mobile.trim()

        if (societyName.isBlank() || chairmanName.isBlank() || email.isBlank() || mobile.isBlank())
            throw ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Society name, chairman name, email, and mobile are required.")
        if (!emailRegex.matches(email))
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid email address.")

        return repo.save(Enquiry(societyName = societyName, chairmanName = chairmanName,
                                 email = email, mobile = mobile))
    }

    fun findAll(status: String?): List<Enquiry> =
        if (!status.isNullOrBlank()) repo.findAllByStatus(status)
        else repo.findAllByOrderByCreatedAtDesc()

    fun updateStatus(id: Long, req: UpdateEnquiryStatusRequest): Enquiry {
        val status = EnquiryStatus.fromString(req.status)
            ?: throw ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Status must be one of: ${EnquiryStatus.validLabels.joinToString()}")
        val e = repo.findById(id).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND, "Enquiry not found.")
        }
        e.status = status.label
        return repo.save(e)
    }
}
