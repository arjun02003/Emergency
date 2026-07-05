const express = require("express");
const router = express.Router();

const { protect, hospitalOnly } = require("../middleware/AuthMiddleware");
const {
  driverLogin,
  createAmbulance,
  getMyAmbulances,
  updateAmbulance,
  deleteAmbulance,
  resetDriverPassword,
} = require("../controllers/AmbulanceController");

router.post("/login", driverLogin);
router.post("/create", protect, hospitalOnly, createAmbulance);
router.get("/my-ambulances", protect, hospitalOnly, getMyAmbulances);
router.put("/update/:id", protect, hospitalOnly, updateAmbulance);
router.delete("/delete/:id", protect, hospitalOnly, deleteAmbulance);
router.put("/reset-password/:id", protect, hospitalOnly, resetDriverPassword);

module.exports = router;
