package com.digisociety.backend.repositories

import com.digisociety.backend.models.User
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional

@Repository
interface UserRepository : JpaRepository<User, Long> {
    fun findByEmailIgnoreCase(email: String): Optional<User>
    fun existsByEmailIgnoreCase(email: String): Boolean
    fun findAllBySocietyId(societyId: Long): List<User>
}
