package com.digisociety.backend.services

import com.digisociety.backend.models.Notice
import com.digisociety.backend.models.NoticeRequest
import com.digisociety.backend.models.NoticeUpdateRequest
import com.digisociety.backend.repositories.NoticeRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException

@Service
class NoticeService(private val repo: NoticeRepository) {

    fun findAll(societyId: Long): List<Notice> = repo.findAllBySocietyId(societyId)

    fun findById(id: Long, societyId: Long): Notice {
        val n = repo.findById(id).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND, "Notice not found.")
        }
        if (n.societyId != societyId)
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied.")
        return n
    }

    fun create(req: NoticeRequest, societyId: Long, postedBy: Long?): Notice {
        if (req.title.isBlank() || req.content.isBlank())
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Title and content are required.")
        return repo.save(Notice(
            societyId = societyId,    // from JWT
            postedBy = postedBy, title = req.title.trim(),
            content = req.content, category = req.category, expiresAt = req.expiresAt
        ))
    }

    fun update(id: Long, req: NoticeUpdateRequest, societyId: Long): Notice {
        val n = findById(id, societyId)
        req.title?.let      { n.title     = it.trim() }
        req.content?.let    { n.content   = it }
        req.category?.let   { n.category  = it }
        req.isActive?.let   { n.isActive  = it }
        req.expiresAt?.let  { n.expiresAt = it }
        return repo.save(n)
    }

    fun delete(id: Long, societyId: Long) = repo.delete(findById(id, societyId))
}
