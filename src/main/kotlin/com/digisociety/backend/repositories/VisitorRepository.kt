package com.digisociety.backend.repositories

import com.digisociety.backend.models.Visitor
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface VisitorRepository : JpaRepository<Visitor, Long> {
    fun findAllBySocietyId(societyId: Long): List<Visitor>
}
