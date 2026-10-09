/*
 * ─────────────────────────────────────────────────────────────────────────────
 * Lab Outcome : Implement backend services in Kotlin with database integration
 *               and secure authentication.
 *
 * Aim 1       : Write Kotlin programs to demonstrate data types, collections,
 *               and OOP concepts (classes, inheritance).
 *
 * Aim 2       : Write Kotlin program to implement exception handling and use
 *               collection operations (map, filter, reduce).
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * GlobalExceptionHandler.kt
 *
 * Centralised exception handler for the entire Spring Boot application.
 * Equivalent to the global error-handler middleware at the bottom of server.js:
 *
 *   app.use((err, _req, res, _next) => {
 *     res.status(500).json({ success: false, message: "Internal server error." });
 *   });
 *
 * In Spring Boot this is done with @ControllerAdvice + @ExceptionHandler.
 * Every unhandled exception thrown from any controller is caught here and
 * converted into a consistent JSON error response.
 *
 * Demonstrates:
 *   • Exception handling : @ExceptionHandler, try/catch hierarchy,
 *                          custom exceptions (DigiSocietyException subtypes),
 *                          when-expression on exception type
 *   • Collections        : mapOf() to build structured error payloads,
 *                          map() to extract constraint violation messages
 *   • Data types         : String, Int, Boolean, Map<String, Any?>
 *   • OOP                : @ControllerAdvice class, companion object, sealed-
 *                          class-style dispatch via when(exception)
 */

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
import org.springframework.web.servlet.NoHandlerFoundException
import java.time.Instant

// ── OOP: @RestControllerAdvice — intercepts exceptions from all @RestControllers ─
@RestControllerAdvice
class GlobalExceptionHandler {

    companion object {
        private val log = LoggerFactory.getLogger(GlobalExceptionHandler::class.java)
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. Custom business-logic exceptions (DigiSocietyException hierarchy)
    //    Exception handling: when-expression dispatches on subtype
    // ─────────────────────────────────────────────────────────────────────────
    @ExceptionHandler(DigiSocietyException::class)
    fun handleDigiSocietyException(
        ex: DigiSocietyException,
        request: HttpServletRequest
    ): ResponseEntity<Map<String, Any?>> {

        // ── Exception handling: when on subtype — mirrors JS switch on error codes
        val status: HttpStatus = when (ex) {
            is UnitNotFoundException       -> HttpStatus.NOT_FOUND             // 404
            is InvalidDuesAmountException  -> HttpStatus.UNPROCESSABLE_ENTITY  // 422
            is EmptyCollectionException    -> HttpStatus.BAD_REQUEST           // 400
            else                           -> HttpStatus.INTERNAL_SERVER_ERROR // 500
        }

        log.warn("[GlobalExceptionHandler] Business error on ${request.requestURI}: ${ex.message}")

        return ResponseEntity.status(status).body(
            errorBody(
                success = false,
                message = ex.message ?: "An error occurred.",
                path    = request.requestURI,
                code    = status.value()
            )
        )
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. Malformed / unreadable request body (e.g. bad JSON)
    //    Exception handling: HttpMessageNotReadableException
    // ─────────────────────────────────────────────────────────────────────────
    @ExceptionHandler(HttpMessageNotReadableException::class)
    fun handleUnreadableBody(
        ex: HttpMessageNotReadableException,
        request: HttpServletRequest
    ): ResponseEntity<Map<String, Any?>> {

        log.warn("[GlobalExceptionHandler] Unreadable body on ${request.requestURI}: ${ex.message}")

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            errorBody(
                success = false,
                message = "Request body is missing or malformed JSON.",
                path    = request.requestURI,
                code    = 400
            )
        )
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. Validation errors (@Valid annotation failures)
    //    Collection operation: map() to extract all field-level error messages
    // ─────────────────────────────────────────────────────────────────────────
    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidationErrors(
        ex: MethodArgumentNotValidException,
        request: HttpServletRequest
    ): ResponseEntity<Map<String, Any?>> {

        // ── map() — transform FieldError list into readable String list ────────
        val fieldErrors: List<String> = ex.bindingResult.fieldErrors
            .map { err -> "${err.field}: ${err.defaultMessage}" }

        log.warn("[GlobalExceptionHandler] Validation failed: $fieldErrors")

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            mapOf(
                "success"   to false,
                "message"   to "Validation failed.",
                "errors"    to fieldErrors,          // Collections: List<String>
                "path"      to request.requestURI,
                "timestamp" to Instant.now().toString(),
                "code"      to 400
            )
        )
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. Missing required query parameter
    // ─────────────────────────────────────────────────────────────────────────
    @ExceptionHandler(MissingServletRequestParameterException::class)
    fun handleMissingParam(
        ex: MissingServletRequestParameterException,
        request: HttpServletRequest
    ): ResponseEntity<Map<String, Any?>> {

        log.warn("[GlobalExceptionHandler] Missing param '${ex.parameterName}' on ${request.requestURI}")

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            errorBody(
                success = false,
                message = "Required parameter '${ex.parameterName}' is missing.",
                path    = request.requestURI,
                code    = 400
            )
        )
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. Wrong type for a path variable or query param (e.g. /users/abc)
    // ─────────────────────────────────────────────────────────────────────────
    @ExceptionHandler(MethodArgumentTypeMismatchException::class)
    fun handleTypeMismatch(
        ex: MethodArgumentTypeMismatchException,
        request: HttpServletRequest
    ): ResponseEntity<Map<String, Any?>> {

        // Data type: String — build friendly message with Kotlin string template
        val expected: String = ex.requiredType?.simpleName ?: "unknown"
        val message:  String = "Parameter '${ex.name}' must be of type $expected."

        log.warn("[GlobalExceptionHandler] Type mismatch on ${request.requestURI}: $message")

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            errorBody(success = false, message = message, path = request.requestURI, code = 400)
        )
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. 404 — no handler found for the route
    // ─────────────────────────────────────────────────────────────────────────
    @ExceptionHandler(NoHandlerFoundException::class)
    fun handleNotFound(
        ex: NoHandlerFoundException,
        request: HttpServletRequest
    ): ResponseEntity<Map<String, Any?>> =
        ResponseEntity.status(HttpStatus.NOT_FOUND).body(
            errorBody(
                success = false,
                message = "Route not found: ${ex.requestURL}",
                path    = request.requestURI,
                code    = 404
            )
        )

    // ─────────────────────────────────────────────────────────────────────────
    // 7. Catch-all — mirrors server.js global error handler
    //    Exception handling: broadest net — catches anything not caught above
    // ─────────────────────────────────────────────────────────────────────────
    @ExceptionHandler(Exception::class)
    fun handleGenericException(
        ex: Exception,
        request: HttpServletRequest
    ): ResponseEntity<Map<String, Any?>> {

        log.error("[GlobalExceptionHandler] Unhandled error on ${request.requestURI}", ex)

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
            errorBody(
                success = false,
                message = "Internal server error.",
                path    = request.requestURI,
                code    = 500
            )
        )
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helper — builds a consistent error response Map
    // Collections: mapOf() — same structure across all handlers
    // ─────────────────────────────────────────────────────────────────────────
    private fun errorBody(
        success: Boolean,
        message: String,
        path:    String,
        code:    Int
    ): Map<String, Any?> = mapOf(
        "success"   to success,
        "message"   to message,
        "path"      to path,
        "code"      to code,
        "timestamp" to Instant.now().toString()   // Data type: String (ISO-8601)
    )
}
