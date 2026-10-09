package com.digisociety.backend.repositories

import com.digisociety.backend.models.Enquiry
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface EnquiryRepository : JpaRepository<Enquiry, Long> {
    fun findAllByOrderByCreatedAtDesc(): List<Enquiry>
    fun findAllByStatus(status: String): List<Enquiry>
}
