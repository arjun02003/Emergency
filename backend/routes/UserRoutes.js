const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/AuthMiddleware");
const { getMe } = require("../controllers/UserController");

// GET /api/user/me — returns the authenticated user's profile
router.get("/me", protect, getMe);

module.exports = router;
