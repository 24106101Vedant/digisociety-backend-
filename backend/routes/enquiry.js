/**
 * routes/enquiry.js
 *
 * POST /api/enquiry       – submit a new society enquiry (public)
 * GET  /api/enquiry       – list all enquiries (admin only)
 * PUT  /api/enquiry/:id   – update enquiry status (admin only)
 */

const express = require("express");
const { requireAuth } = require("../middleware/auth");
const {
  createEnquiry,
  getAllEnquiries,
  updateStatus,
} = require("../controllers/enquiryController");

const router = express.Router();

router.post("/",    createEnquiry);
router.get( "/",    requireAuth, getAllEnquiries);
router.put( "/:id", requireAuth, updateStatus);

module.exports = router;
