package com.digisociety.backend.services

import com.digisociety.backend.models.Member
import com.digisociety.backend.models.MemberRequest
import com.digisociety.backend.repositories.MemberRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException

@Service
class MemberService(private val repo: MemberRepository) {

    /** All results scoped to the authenticated society — never trust front-end societyId. */
    fun findAll(societyId: Long): List<Member> = repo.findAllBySocietyId(societyId)

    fun findById(id: Long, societyId: Long): Member {
        val m = repo.findById(id).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found.")
        }
        if (m.societyId != societyId)
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied.")
        return m
    }

    fun create(req: MemberRequest, societyId: Long): Member {
        if (req.flatNumber.isBlank() || req.ownerName.isBlank())
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Flat number and owner name are required.")
        return repo.save(Member(
            societyId = societyId,          // always from JWT — never from request body
            flatNumber = req.flatNumber.trim(), ownerName = req.ownerName.trim(),
            email = req.email, mobile = req.mobile, type = req.type,
            floorNumber = req.floorNumber, areaSqft = req.areaSqft, moveInDate = req.moveInDate
        ))
    }

    fun update(id: Long, req: MemberRequest, societyId: Long): Member {
        val m = findById(id, societyId)
        if (req.flatNumber.isNotBlank()) m.flatNumber = req.flatNumber.trim()
        if (req.ownerName.isNotBlank())  m.ownerName  = req.ownerName.trim()
        req.email?.let       { m.email       = it }
        req.mobile?.let      { m.mobile      = it }
        req.floorNumber?.let { m.floorNumber = it }
        req.areaSqft?.let    { m.areaSqft    = it }
        req.moveInDate?.let  { m.moveInDate  = it }
        m.type = req.type
        return repo.save(m)
    }

    fun delete(id: Long, societyId: Long) {
        val m = findById(id, societyId)
        m.isActive = false
        repo.save(m)
    }
}
