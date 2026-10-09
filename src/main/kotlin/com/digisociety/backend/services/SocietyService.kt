package com.digisociety.backend.services

import com.digisociety.backend.models.Society
import com.digisociety.backend.models.SocietyRequest
import com.digisociety.backend.repositories.SocietyRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException

@Service
class SocietyService(private val repo: SocietyRepository) {

    fun findAll(): List<Society> = repo.findAll()

    fun findById(id: Long): Society = repo.findById(id).orElseThrow {
        ResponseStatusException(HttpStatus.NOT_FOUND, "Society not found.")
    }

    fun create(req: SocietyRequest): Society {
        if (req.societyName.isBlank())
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Society name is required.")
        if (req.email.isBlank())
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required.")
        return repo.save(Society(
            societyName = req.societyName.trim(),
            email = req.email.trim().lowercase(),
            mobile = req.mobile,
            address = req.address, city = req.city, state = req.state,
            pincode = req.pincode, registrationNumber = req.registrationNumber,
            chairmanName = req.chairmanName, chairmanMobile = req.chairmanMobile,
            secretaryName = req.secretaryName, totalUnits = req.totalUnits
        ))
    }

    fun update(id: Long, req: SocietyRequest): Society {
        val s = findById(id)
        if (req.societyName.isNotBlank()) s.societyName = req.societyName.trim()
        req.mobile?.let          { s.mobile = it }
        req.address?.let         { s.address = it }
        req.city?.let            { s.city = it }
        req.state?.let           { s.state = it }
        req.pincode?.let         { s.pincode = it }
        req.registrationNumber?.let { s.registrationNumber = it }
        req.chairmanName?.let    { s.chairmanName = it }
        req.chairmanMobile?.let  { s.chairmanMobile = it }
        req.secretaryName?.let   { s.secretaryName = it }
        s.totalUnits = req.totalUnits
        return repo.save(s)
    }

    fun delete(id: Long) {
        val s = findById(id)
        s.status = "suspended"
        repo.save(s)
    }
}
