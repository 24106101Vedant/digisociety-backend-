package com.digisociety.backend.repositories

import com.digisociety.backend.models.Member
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface MemberRepository : JpaRepository<Member, Long> {
    fun findAllBySocietyId(societyId: Long): List<Member>
    fun countBySocietyId(societyId: Long): Long
}
