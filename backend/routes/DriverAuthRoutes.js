const express = require("express");
const router = express.Router();
const {
  loginDriver,
  getDriverProfile,
  getCurrentEmergency,
  acceptTrip,
  startTrip,
  completeTrip,
} = require("../controllers/DriverAuthController");
const { protect, ambulanceOnly } = require("../middleware/AuthMiddleware");

router.post("/login", loginDriver);
router.get("/profile", protect, ambulanceOnly, getDriverProfile);
router.get("/current-emergency", protect, ambulanceOnly, getCurrentEmergency);
router.put("/accept-trip/:id", protect, ambulanceOnly, acceptTrip);
router.put("/start-trip/:id", protect, ambulanceOnly, startTrip);
router.put("/complete-trip/:id", protect, ambulanceOnly, completeTrip);

module.exports = router;
