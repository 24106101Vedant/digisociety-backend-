package com.digisociety.backend.middleware

import com.digisociety.backend.utils.DigiSocietyException
import com.digisociety.backend.utils.EmptyCollectionException
import com.digisociety.backend.utils.InvalidDuesAmountException
import com.digisociety.backend.utils.UnitNotFoundException
import jakarta.servlet.http.HttpServletRequest
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.MissingServletRequestParameterException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException
import org.springframework.web.server.ResponseStatusException
import org.springframework.web.servlet.NoHandlerFoundException
import java.time.Instant

@RestControllerAdvice
class GlobalExceptionHandler {

    companion object {
        private val log = LoggerFactory.getLogger(GlobalExceptionHandler::class.java)
    }

    /** Spring's ResponseStatusException — thrown by services with a specific status code */
    @ExceptionHandler(ResponseStatusException::class)
    fun handleResponseStatus(
        ex: ResponseStatusException,
        request: HttpServletRequest
    ): ResponseEntity<Map<String, Any?>> {
        log.warn("[GlobalExceptionHandler] ${ex.statusCode} on ${request.requestURI}: ${ex.reason}")
        return ResponseEntity.status(ex.statusCode).body(
            errorBody(false, ex.reason ?: "An error occurred.", request.requestURI, ex.statusCode.value())
        )
    }

    /** Custom business-logic exceptions from CollectionOps */
    @ExceptionHandler(DigiSocietyException::class)
    fun handleDigiSociety(ex: DigiSocietyException, request: HttpServletRequest): ResponseEntity<Map<String, Any?>> {
        val status = when (ex) {
            is UnitNotFoundException      -> HttpStatus.NOT_FOUND
            is InvalidDuesAmountException -> HttpStatus.UNPROCESSABLE_ENTITY
            is EmptyCollectionException   -> HttpStatus.BAD_REQUEST
            else                          -> HttpStatus.INTERNAL_SERVER_ERROR
        }
        log.warn("[GlobalExceptionHandler] Business error on ${request.requestURI}: ${ex.message}")
        return ResponseEntity.status(status).body(
            errorBody(false, ex.message ?: "An error occurred.", request.requestURI, status.value())
        )
    }

    @ExceptionHandler(HttpMessageNotReadableException::class)
    fun handleUnreadableBody(ex: HttpMessageNotReadableException, request: HttpServletRequest) =
        ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            errorBody(false, "Request body is missing or malformed JSON.", request.requestURI, 400)
        )

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidation(ex: MethodArgumentNotValidException, request: HttpServletRequest): ResponseEntity<Map<String, Any?>> {
        val errors = ex.bindingResult.fieldErrors.map { "${it.field}: ${it.defaultMessage}" }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(mapOf(
            "success" to false, "message" to "Validation failed.",
            "errors" to errors, "path" to request.requestURI,
            "timestamp" to Instant.now().toString(), "code" to 400
        ))
    }

    @ExceptionHandler(MissingServletRequestParameterException::class)
    fun handleMissingParam(ex: MissingServletRequestParameterException, request: HttpServletRequest) =
        ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            errorBody(false, "Required parameter '${ex.parameterName}' is missing.", request.requestURI, 400)
        )

    @ExceptionHandler(MethodArgumentTypeMismatchException::class)
    fun handleTypeMismatch(ex: MethodArgumentTypeMismatchException, request: HttpServletRequest) =
        ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            errorBody(false, "Parameter '${ex.name}' must be of type ${ex.requiredType?.simpleName}.", request.requestURI, 400)
        )

    @ExceptionHandler(NoHandlerFoundException::class)
    fun handleNotFound(ex: NoHandlerFoundException, request: HttpServletRequest) =
        ResponseEntity.status(HttpStatus.NOT_FOUND).body(
            errorBody(false, "Route not found: ${ex.requestURL}", request.requestURI, 404)
        )

    @ExceptionHandler(Exception::class)
    fun handleGeneric(ex: Exception, request: HttpServletRequest): ResponseEntity<Map<String, Any?>> {
        log.error("[GlobalExceptionHandler] Unhandled on ${request.requestURI}", ex)
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
            errorBody(false, "Internal server error.", request.requestURI, 500)
        )
    }

    private fun errorBody(success: Boolean, message: String, path: String, code: Int): Map<String, Any?> =
        mapOf("success" to success, "message" to message, "path" to path,
              "code" to code, "timestamp" to Instant.now().toString())
}
