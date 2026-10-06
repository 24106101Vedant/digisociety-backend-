package com.digisociety.backend.repositories

import com.digisociety.backend.models.Document
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface DocumentRepository : JpaRepository<Document, Long> {
    fun findAllBySocietyId(societyId: Long): List<Document>
}
