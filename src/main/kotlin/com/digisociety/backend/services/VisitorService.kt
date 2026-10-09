package com.digisociety.backend.services

import com.digisociety.backend.models.Visitor
import com.digisociety.backend.models.VisitorRequest
import com.digisociety.backend.models.VisitorUpdateRequest
import com.digisociety.backend.repositories.VisitorRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException

@Service
class VisitorService(private val repo: VisitorRepository) {

    fun findAll(societyId: Long): List<Visitor> = repo.findAllBySocietyId(societyId)

    fun findById(id: Long, societyId: Long): Visitor {
        val v = repo.findById(id).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND, "Visitor not found.")
        }
        if (v.societyId != societyId)
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied.")
        return v
    }

    fun create(req: VisitorRequest, societyId: Long): Visitor {
        if (req.visitorName.isBlank())
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Visitor name is required.")
        return repo.save(Visitor(
            societyId = societyId,    // from JWT
            visitorName = req.visitorName.trim(),
            mobile = req.mobile, flatToVisit = req.flatToVisit, purpose = req.purpose
        ))
    }

    fun update(id: Long, req: VisitorUpdateRequest, societyId: Long): Visitor {
        val v = findById(id, societyId)
        req.status?.let   { v.status   = it }
        req.exitTime?.let { v.exitTime = it }
        return repo.save(v)
    }

    fun delete(id: Long, societyId: Long) = repo.delete(findById(id, societyId))
}
