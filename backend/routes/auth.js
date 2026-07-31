/**
 * routes/auth.js
 *
 * POST /api/auth/register        – create a new user account
 * POST /api/auth/login           – validate credentials, return JWT
 * GET  /api/auth/me              – return current user (protected)
 * POST /api/auth/logout          – client-side token drop (stateless)
 * POST /api/auth/forgot-password – request a password reset link
 */

const express = require("express");
const { requireAuth } = require("../middleware/auth");
const {
  register,
  login,
  getMe,
  logout,
  forgotPassword,
} = require("../controllers/authController");

const router = express.Router();

router.post("/register",        register);
router.post("/login",           login);
router.get( "/me",              requireAuth, getMe);
router.post("/logout",          requireAuth, logout);
router.post("/forgot-password", forgotPassword);

module.exports = router;
