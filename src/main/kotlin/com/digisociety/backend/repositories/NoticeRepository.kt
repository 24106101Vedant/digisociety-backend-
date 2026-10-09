package com.digisociety.backend.repositories

import com.digisociety.backend.models.Notice
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface NoticeRepository : JpaRepository<Notice, Long> {
    fun findAllBySocietyIdAndIsActiveTrue(societyId: Long): List<Notice>
    fun findAllBySocietyId(societyId: Long): List<Notice>
}
