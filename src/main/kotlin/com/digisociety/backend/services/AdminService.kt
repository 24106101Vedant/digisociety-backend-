package com.digisociety.backend.services

import com.digisociety.backend.repositories.*
import com.digisociety.backend.utils.CollectionOpsService
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service

@Service
class AdminService(
    private val userRepo:      UserRepository,
    private val logRepo:       LoginLogRepository,
    private val societyRepo:   SocietyRepository,
    private val memberRepo:    MemberRepository,
    private val complaintRepo: ComplaintRepository,
    private val enquiryRepo:   EnquiryRepository,
    private val collectionOps: CollectionOpsService
) {
    /** Platform-level dashboard (super_admin only). */
    fun dashboard(): Map<String, Any?> {
        val totalUsers     = userRepo.count()
        val activeUsers    = userRepo.findAll().count { it.isActive }.toLong()
        val totalSocieties = societyRepo.count()
        val openComplaints = complaintRepo.countByStatus("open")
        val newEnquiries   = enquiryRepo.findAllByStatus("New").size.toLong()
        val successLogins  = logRepo.countBySuccess(true)
        val failedLogins   = logRepo.countBySuccess(false)
        val recentLogs     = logRepo.findAllByOrderByLoggedAtDesc(PageRequest.of(0, 10))
            .map { mapOf("email" to it.email, "societyId" to it.societyId,
                         "success" to it.success, "loggedAt" to it.loggedAt) }

        return mapOf(
            "stats" to mapOf(
                "totalUsers"     to totalUsers,    "activeUsers"    to activeUsers,
                "totalSocieties" to totalSocieties,"openComplaints" to openComplaints,
                "newEnquiries"   to newEnquiries,  "successLogins"  to successLogins,
                "failedLogins"   to failedLogins
            ),
            "recentLoginLogs" to recentLogs
        )
    }

    /** Society-scoped dashboard — returns only that society's stats. */
    fun societyDashboard(societyId: Long): Map<String, Any?> {
        val members    = memberRepo.countBySocietyId(societyId)
        val complaints = complaintRepo.countByStatus("open")
        val recentLogs = logRepo.findAllBySocietyIdOrderByLoggedAtDesc(societyId, PageRequest.of(0, 10))
            .map { mapOf("email" to it.email, "success" to it.success, "loggedAt" to it.loggedAt) }

        return mapOf(
            "societyId" to societyId,
            "stats" to mapOf("totalMembers" to members, "openComplaints" to complaints),
            "recentLoginLogs" to recentLogs
        )
    }

    fun loginLogs(limit: Int): List<Map<String, Any?>> =
        logRepo.findAllByOrderByLoggedAtDesc(PageRequest.of(0, minOf(limit, 200)))
            .map { mapOf("id" to it.id, "email" to it.email, "societyId" to it.societyId,
                         "success" to it.success, "ipAddress" to it.ipAddress,
                         "userAgent" to it.userAgent, "loggedAt" to it.loggedAt) }

    fun societyAnalytics(): Map<String, Any?> = collectionOps.societyAnalytics()
}
