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
 * CollectionOps.kt
 *
 * Standalone demonstration of Kotlin collection operations — map, filter,
 * and reduce — applied to realistic Housing Society domain data.
 *
 * Also exposes a Spring @Component (CollectionOpsService) that the
 * AdminController can call to compute dashboard analytics, showing the same
 * operations working inside a live backend context.
 *
 * Demonstrates:
 *   • Collection operations : map, filter, reduce, groupBy, sortedByDescending,
 *                             associate, count, sumOf, maxByOrNull, minByOrNull
 *   • Exception handling    : try/catch, custom exceptions, requireNotNull,
 *                             check, runCatching, Result<T>
 *   • Data types            : Int, Long, Double, String, Boolean, nullable (?)
 *   • OOP                   : data class, object (singleton), companion object
 */

package com.digisociety.backend.utils

import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component

// ─────────────────────────────────────────────────────────────────────────────
// Domain data classes used throughout the demos
// ─────────────────────────────────────────────────────────────────────────────

data class SocietyUnit(
    val unitNumber:  String,
    val ownerName:   String,
    val floorNumber: Int,
    val monthlyDues: Double,   // in ₹
    val isPaid:      Boolean,
    val role:        String    // "owner" | "tenant"
)

data class MaintenanceRecord(
    val unitNumber:  String,
    val month:       String,   // e.g. "2026-09"
    val amountPaid:  Double,
    val lateFee:     Double
)

// ─────────────────────────────────────────────────────────────────────────────
// Custom exception hierarchy — exception handling demo
// ─────────────────────────────────────────────────────────────────────────────

/** Base exception for all DigiSociety business-logic errors */
open class DigiSocietyException(message: String, cause: Throwable? = null) :
    RuntimeException(message, cause)

/** Thrown when a requested unit does not exist */
class UnitNotFoundException(unitNumber: String) :
    DigiSocietyException("Unit '$unitNumber' not found in the society registry.")

/** Thrown when a dues calculation produces an invalid (negative) result */
class InvalidDuesAmountException(amount: Double) :
    DigiSocietyException("Dues amount must be non-negative, got: $amount")

/** Thrown when an empty collection is passed to an operation that requires data */
class EmptyCollectionException(operation: String) :
    DigiSocietyException("Cannot perform '$operation' on an empty collection.")

// ─────────────────────────────────────────────────────────────────────────────
// CollectionOpsDemo  — object (singleton) with pure demo functions
// ─────────────────────────────────────────────────────────────────────────────
object CollectionOpsDemo {

    private val log = LoggerFactory.getLogger(CollectionOpsDemo::class.java)

    // ── Sample dataset ────────────────────────────────────────────────────────
    val sampleUnits: List<SocietyUnit> = listOf(
        SocietyUnit("A-101", "Ravi Sharma",    1, 2500.0,  true,  "owner"),
        SocietyUnit("A-102", "Priya Mehta",    1, 2500.0,  false, "tenant"),
        SocietyUnit("B-201", "Anjali Verma",   2, 3000.0,  true,  "owner"),
        SocietyUnit("B-202", "Suresh Patil",   2, 3000.0,  false, "owner"),
        SocietyUnit("C-301", "Neha Joshi",     3, 3500.0,  true,  "tenant"),
        SocietyUnit("C-302", "Amit Kulkarni",  3, 3500.0,  true,  "owner"),
        SocietyUnit("D-401", "Deepa Nair",     4, 4000.0,  false, "tenant"),
        SocietyUnit("D-402", "Vikram Singh",   4, 4000.0,  true,  "owner")
    )

    val maintenanceRecords: List<MaintenanceRecord> = listOf(
        MaintenanceRecord("A-101", "2026-07", 2500.0, 0.0),
        MaintenanceRecord("A-101", "2026-08", 2500.0, 0.0),
        MaintenanceRecord("A-101", "2026-09", 2500.0, 0.0),
        MaintenanceRecord("B-201", "2026-07", 3000.0, 0.0),
        MaintenanceRecord("B-201", "2026-08", 3000.0, 150.0),
        MaintenanceRecord("C-301", "2026-09", 3500.0, 0.0),
        MaintenanceRecord("D-402", "2026-09", 4000.0, 200.0)
    )

    // ─────────────────────────────────────────────────────────────────────────
    // 1. MAP  — transform every unit into a summary string
    // ─────────────────────────────────────────────────────────────────────────
    /**
     * map() projects each SocietyUnit to a human-readable label.
     * Exception handling: runCatching wraps any transform failure gracefully.
     */
    fun mapUnitSummaries(): List<String> {
        log.info("[CollectionOps] Running MAP demo")

        return runCatching {
            sampleUnits.map { unit ->
                // Data types: String template, Boolean, Double
                val status: String = if (unit.isPaid) "✅ Paid" else "❌ Unpaid"
                "${unit.unitNumber} | ${unit.ownerName} | Floor ${unit.floorNumber} | ₹${unit.monthlyDues} | $status"
            }
        }.getOrElse { ex ->
            log.error("[map] Failed to generate summaries: ${ex.message}")
            emptyList()
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. FILTER  — find all defaulters (isPaid == false)
    // ─────────────────────────────────────────────────────────────────────────
    /**
     * filter() keeps only units where dues are unpaid.
     * Exception handling: requireNotNull used to guard the result.
     */
    fun filterDefaulters(): List<SocietyUnit> {
        log.info("[CollectionOps] Running FILTER demo")

        val defaulters: List<SocietyUnit> = sampleUnits.filter { unit ->
            !unit.isPaid   // Data type: Boolean predicate
        }

        // Exception handling: check() throws IllegalStateException if violated
        check(defaulters.size <= sampleUnits.size) {
            "Filter produced more results than input — impossible!"
        }

        return defaulters
    }

    /**
     * filter() + map() chained — get names of all unpaid tenants only.
     */
    fun filterUnpaidTenantNames(): List<String> =
        sampleUnits
            .filter { it.role == "tenant" && !it.isPaid }
            .map    { it.ownerName }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. REDUCE  — sum total outstanding dues across all defaulters
    // ─────────────────────────────────────────────────────────────────────────
    /**
     * reduce() accumulates dues into a single total.
     * Exception handling: throws EmptyCollectionException if no defaulters,
     * because reduce() itself throws on an empty list.
     */
    fun reduceTotalOutstanding(): Double {
        log.info("[CollectionOps] Running REDUCE demo")

        val defaulters: List<SocietyUnit> = filterDefaulters()

        if (defaulters.isEmpty()) {
            throw EmptyCollectionException("reduce total outstanding dues")
        }

        // reduce() — fold monthly dues into a running total
        val total: Double = defaulters
            .map    { it.monthlyDues }
            .reduce { acc, dues ->
                val sum: Double = acc + dues
                if (sum < 0) throw InvalidDuesAmountException(sum)  // guard
                sum
            }

        log.info("[CollectionOps] Total outstanding: ₹$total")
        return total
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. COMBINED ANALYTICS  — groupBy + map + reduce + filter + sumOf
    // ─────────────────────────────────────────────────────────────────────────
    /**
     * Returns a per-floor summary map using multiple collection operations.
     * Exception handling: try/catch with custom exception propagation.
     */
    fun floorWiseSummary(): Map<Int, Map<String, Any>> {
        log.info("[CollectionOps] Running COMBINED analytics demo")

        return try {
            // groupBy — group units by floor number (Int key)
            val byFloor: Map<Int, List<SocietyUnit>> =
                sampleUnits.groupBy { it.floorNumber }

            // map on map entries — transform each group into a stats object
            byFloor.map { (floor, units) ->
                val totalUnits:   Int    = units.count()
                val paidUnits:    Int    = units.count { it.isPaid }
                val unpaidUnits:  Int    = units.count { !it.isPaid }

                // sumOf — sum monthly dues for the floor
                val totalDues:    Double = units.sumOf { it.monthlyDues }

                // filter + sumOf — only outstanding
                val outstanding:  Double = units
                    .filter { !it.isPaid }
                    .sumOf  { it.monthlyDues }

                floor to mapOf(
                    "totalUnits"  to totalUnits,
                    "paidUnits"   to paidUnits,
                    "unpaidUnits" to unpaidUnits,
                    "totalDues"   to totalDues,
                    "outstanding" to outstanding
                )
            }.toMap()

        } catch (ex: DigiSocietyException) {
            log.error("[floorWiseSummary] Business error: ${ex.message}")
            throw ex                           // re-throw for caller to handle
        } catch (ex: Exception) {
            log.error("[floorWiseSummary] Unexpected error: ${ex.message}")
            throw DigiSocietyException("Floor summary failed.", ex)
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. MAINTENANCE ANALYTICS  — map + filter + reduce on records
    // ─────────────────────────────────────────────────────────────────────────
    /**
     * Total late fees collected across all maintenance records.
     * Demonstrates: filter + map + reduce on a secondary collection.
     */
    fun totalLateFeesCollected(): Double {
        val recordsWithLateFee: List<MaintenanceRecord> =
            maintenanceRecords.filter { it.lateFee > 0.0 }

        if (recordsWithLateFee.isEmpty()) return 0.0

        return recordsWithLateFee
            .map    { it.lateFee }
            .reduce { acc, fee -> acc + fee }
    }

    /**
     * Per-unit total payment history using groupBy + map + sumOf.
     */
    fun perUnitPaymentTotals(): Map<String, Double> =
        maintenanceRecords
            .groupBy { it.unitNumber }
            .map     { (unit, records) -> unit to records.sumOf { it.amountPaid } }
            .toMap()

    /**
     * Find the unit with the highest total dues paid (maxByOrNull).
     * Exception handling: requireNotNull throws if collection is empty.
     */
    fun topPayingUnit(): Pair<String, Double> {
        val totals: Map<String, Double> = perUnitPaymentTotals()

        val topEntry = requireNotNull(totals.maxByOrNull { it.value }) {
            "No maintenance records found — cannot determine top paying unit."
        }

        return topEntry.key to topEntry.value
    }

    /**
     * Safe lookup — exception handling via runCatching + Result<T>.
     * Returns Result.success(unit) or Result.failure(UnitNotFoundException).
     */
    fun findUnitSafe(unitNumber: String): Result<SocietyUnit> =
        runCatching {
            sampleUnits.first { it.unitNumber == unitNumber }.also {
                log.info("[findUnit] Found: ${it.unitNumber} — ${it.ownerName}")
            }
        }.recoverWith { _ ->
            Result.failure(UnitNotFoundException(unitNumber))
        }
}

// ─────────────────────────────────────────────────────────────────────────────
// CollectionOpsService  — Spring bean, callable from controllers
// ─────────────────────────────────────────────────────────────────────────────
@Component
class CollectionOpsService {

    private val log = LoggerFactory.getLogger(CollectionOpsService::class.java)

    /**
     * Returns a complete analytics report as a Map — used by AdminController
     * GET /api/admin/society-analytics endpoint.
     *
     * All exception handling is centralised: any DigiSocietyException bubbles
     * to GlobalExceptionHandler, which converts it to a JSON error response.
     */
    fun societyAnalytics(): Map<String, Any?> {
        log.info("[CollectionOpsService] Building society analytics")

        // ── map  ──────────────────────────────────────────────────────────────
        val unitSummaries: List<String> = CollectionOpsDemo.mapUnitSummaries()

        // ── filter ────────────────────────────────────────────────────────────
        val defaulters: List<Map<String, Any?>> = CollectionOpsDemo.filterDefaulters()
            .map { u ->
                mapOf(
                    "unit"        to u.unitNumber,
                    "owner"       to u.ownerName,
                    "monthlyDues" to u.monthlyDues
                )
            }

        val unpaidTenantNames: List<String> = CollectionOpsDemo.filterUnpaidTenantNames()

        // ── reduce ────────────────────────────────────────────────────────────
        val totalOutstanding: Double = runCatching {
            CollectionOpsDemo.reduceTotalOutstanding()
        }.getOrElse { ex ->
            log.warn("[societyAnalytics] Reduce skipped: ${ex.message}")
            0.0
        }

        // ── groupBy + map + sumOf ─────────────────────────────────────────────
        val floorSummary: Map<Int, Map<String, Any>> =
            CollectionOpsDemo.floorWiseSummary()

        // ── filter + reduce on maintenance records ────────────────────────────
        val lateFees:        Double              = CollectionOpsDemo.totalLateFeesCollected()
        val paymentTotals:   Map<String, Double> = CollectionOpsDemo.perUnitPaymentTotals()

        // ── maxByOrNull ───────────────────────────────────────────────────────
        val (topUnit, topAmount) = runCatching {
            CollectionOpsDemo.topPayingUnit()
        }.getOrElse { "N/A" to 0.0 }

        // ── Collections: build final response map ─────────────────────────────
        return mapOf(
            "unitSummaries"     to unitSummaries,
            "defaulters"        to defaulters,
            "unpaidTenantNames" to unpaidTenantNames,
            "totalOutstanding"  to totalOutstanding,
            "floorWiseSummary"  to floorSummary,
            "totalLateFeesCollected" to lateFees,
            "perUnitPaymentTotals"   to paymentTotals,
            "topPayingUnit"     to mapOf("unit" to topUnit, "totalPaid" to topAmount)
        )
    }
}
