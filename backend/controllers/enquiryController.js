/**
 * controllers/enquiryController.js
 *
 * Handles enquiry form business logic:
 *   createEnquiry    – validate, save to PostgreSQL
 *   getAllEnquiries  – list enquiries (admin only)
 *   updateStatus     – update enquiry status (admin only)
 */

const pool = require("../config/db");

// ─── Create Enquiry ───────────────────────────────────────────────────────
async function createEnquiry(req, res) {
  try {
    const { society_name, chairman_name, email, mobile } = req.body;

    // Validate required fields
    if (!society_name || !chairman_name || !email || !mobile) {
      return res.status(400).json({
        success: false,
        message: "Society name, chairman name, email, and mobile are required.",
      });
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ success: false, message: "Invalid email address." });
    }

    // Insert into PostgreSQL enquiries table
    await pool.query(
      `INSERT INTO enquiries (society_name, chairman_name, email, mobile)
       VALUES ($1, $2, $3, $4)`,
      [
        society_name.trim(),
        chairman_name.trim(),
        email.trim().toLowerCase(),
        mobile.trim(),
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Enquiry submitted successfully. We will contact you soon.",
    });
  } catch (err) {
    console.error("[createEnquiry] error:", err);
    return res.status(500).json({ success: false, message: "Internal server error. Please try again." });
  }
}

// ─── Get All Enquiries (Admin Only) ───────────────────────────────────────
async function getAllEnquiries(req, res) {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required." });
    }

    const limit  = Math.min(parseInt(req.query.limit)  || 50,  200);
    const offset = parseInt(req.query.offset) || 0;
    const status = req.query.status; // optional filter: New, Contacted, Closed

    let sql      = "SELECT * FROM enquiries";
    const params = [];

    if (status) {
      sql += " WHERE status = $1";
      params.push(status);
    }

    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(sql, params);
    const enquiries = result.rows;

    const countResult = await pool.query(
      status
        ? "SELECT COUNT(*) AS total FROM enquiries WHERE status = $1"
        : "SELECT COUNT(*) AS total FROM enquiries",
      status ? [status] : []
    );

    return res.json({
      success: true,
      data: enquiries,
      total: parseInt(countResult.rows[0].total),
    });
  } catch (err) {
    console.error("[getAllEnquiries] error:", err);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// ─── Update Enquiry Status (Admin Only) ───────────────────────────────────
async function updateStatus(req, res) {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required." });
    }

    const { status } = req.body;
    const validStatuses = ["New", "Contacted", "Closed"];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(", ")}.`,
      });
    }

    const result = await pool.query(
      "SELECT id FROM enquiries WHERE id = $1",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Enquiry not found." });
    }

    await pool.query(
      "UPDATE enquiries SET status = $1 WHERE id = $2",
      [status, req.params.id]
    );

    return res.json({ success: true, message: `Enquiry status updated to '${status}'.` });
  } catch (err) {
    console.error("[updateStatus] error:", err);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
}

module.exports = { createEnquiry, getAllEnquiries, updateStatus };
