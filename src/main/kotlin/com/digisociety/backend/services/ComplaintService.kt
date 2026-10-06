package com.digisociety.backend.services

import com.digisociety.backend.models.Complaint
import com.digisociety.backend.models.ComplaintRequest
import com.digisociety.backend.models.ComplaintUpdateRequest
import com.digisociety.backend.repositories.ComplaintRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import java.time.Instant

@Service
class ComplaintService(private val repo: ComplaintRepository) {

    fun findAll(societyId: Long): List<Complaint> = repo.findAllBySocietyId(societyId)

    fun findById(id: Long, societyId: Long): Complaint {
        val c = repo.findById(id).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND, "Complaint not found.")
        }
        if (c.societyId != societyId)
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied.")
        return c
    }

    fun create(req: ComplaintRequest, societyId: Long): Complaint {
        if (req.subject.isBlank())
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Subject is required.")
        return repo.save(Complaint(
            societyId = societyId,      // from JWT — never from request body
            memberId = req.memberId, subject = req.subject.trim(),
            description = req.description, priority = req.priority
        ))
    }

    fun update(id: Long, req: ComplaintUpdateRequest, societyId: Long): Complaint {
        val c = findById(id, societyId)
        req.subject?.let     { c.subject     = it.trim() }
        req.description?.let { c.description = it }
        req.priority?.let    { c.priority    = it }
        req.status?.let {
            c.status = it
            if (it == "resolved" && c.resolvedAt == null) c.resolvedAt = Instant.now()
        }
        return repo.save(c)
    }

    fun delete(id: Long, societyId: Long) = repo.delete(findById(id, societyId))
}
