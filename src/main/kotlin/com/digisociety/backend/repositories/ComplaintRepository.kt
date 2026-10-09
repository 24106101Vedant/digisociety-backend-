package com.digisociety.backend.repositories

import com.digisociety.backend.models.Complaint
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface ComplaintRepository : JpaRepository<Complaint, Long> {
    fun findAllBySocietyId(societyId: Long): List<Complaint>
    fun countByStatus(status: String): Long
}
