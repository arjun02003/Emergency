const express = require("express");
const router = express.Router();

const { protect, hospitalOnly } = require("../middleware/AuthMiddleware");

const {
  createEmergency,
  getEmergencyStatus,
  getPendingEmergencies,
  acceptEmergency,
  assignAmbulance,
  rejectEmergency,
} = require("../controllers/EmergencyController");

// Test Route
router.get("/test", (req, res) => {
  res.send("Emergency Routes Working ✅");
});

// Temporary Test Route for Accept
router.put("/accept/test", (req, res) => {
  res.json({
    success: true,
    message: "Accept Route Working ✅"
  });
});

// Existing Routes
router.post("/create", protect, createEmergency);
router.get("/me", protect, getEmergencyStatus);
router.get("/pending", protect, getPendingEmergencies);

// New Routes
router.put("/accept/:id", protect, hospitalOnly, acceptEmergency);
router.put("/assign-ambulance/:id", protect, hospitalOnly, assignAmbulance);
router.put("/reject/:id", protect, hospitalOnly, rejectEmergency);

module.exports = router;