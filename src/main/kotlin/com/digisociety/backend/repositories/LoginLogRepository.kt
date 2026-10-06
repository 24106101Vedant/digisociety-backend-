package com.digisociety.backend.repositories

import com.digisociety.backend.models.LoginLog
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface LoginLogRepository : JpaRepository<LoginLog, Long> {
    fun findAllByOrderByLoggedAtDesc(pageable: Pageable): List<LoginLog>
    fun countBySuccess(success: Boolean): Long
    fun findAllBySocietyIdOrderByLoggedAtDesc(societyId: Long, pageable: Pageable): List<LoginLog>
}
