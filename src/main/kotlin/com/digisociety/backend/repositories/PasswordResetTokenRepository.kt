package com.digisociety.backend.repositories

import com.digisociety.backend.models.PasswordResetToken
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Repository
interface PasswordResetTokenRepository : JpaRepository<PasswordResetToken, Long> {

    fun findAllByUserIdAndUsedFalseAndExpiresAtAfter(
        userId: Long, now: Instant
    ): List<PasswordResetToken>

    @Modifying
    @Transactional
    @Query("UPDATE PasswordResetToken t SET t.used = true WHERE t.userId = :userId")
    fun invalidateAllForUser(userId: Long)
}
