package com.digisociety.backend.repositories

import com.digisociety.backend.models.Society
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface SocietyRepository : JpaRepository<Society, Long> {
    // Society model uses 'status' (String: "active"/"suspended"/"pending"), not isActive
    fun findAllByStatus(status: String): List<Society>
    fun findAllByStatusNot(status: String): List<Society>
}
