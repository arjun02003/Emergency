const express = require("express");
const router = express.Router();

const { protect, adminOnly } = require("../middleware/AuthMiddleware");

const { createHospital, getAdminDashboardData, updateHospital, deleteHospital, resetHospitalPassword } = require("../controllers/AdminController");

router.get("/dashboard", protect, adminOnly, getAdminDashboardData);
router.post("/create-hospital", protect, adminOnly, createHospital);
router.put("/hospital/:id", protect, adminOnly, updateHospital);
router.delete("/hospital/:id", protect, adminOnly, deleteHospital);
router.post("/hospital/:id/reset-password", protect, adminOnly, resetHospitalPassword);

module.exports = router;
