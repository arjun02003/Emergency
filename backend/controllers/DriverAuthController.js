const Ambulance = require("../models/Ambulance");
const Emergency = require("../models/Emergency");
const Hospital = require("../models/Hospital");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const populateAssignedEmergency = async (query) => {
  return Emergency.findOne(query)
    .populate("assignedHospital", "name address")
    .populate("ambulance", "driverName driverPhone vehicleNumber vehicleType status")
    .populate("user", "name phone bloodGroup emergencyContact");
};

const getAssignedEmergencyForDriver = async (driverId) => {
  return populateAssignedEmergency({
    ambulance: driverId,
    status: { $in: ["ambulance_assigned", "driver_accepted", "driver_on_the_way"] },
  });
};

exports.loginDriver = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const ambulance = await Ambulance.findOne({ email });
    if (!ambulance) {
      return res.status(400).json({
        success: false,
        message: "Ambulance account not found",
      });
    }

    const isMatch = await bcrypt.compare(password, ambulance.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        id: ambulance._id,
        role: "ambulance",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Ambulance login successful",
      token,
      ambulance: {
        id: ambulance._id,
        email: ambulance.email,
        driverName: ambulance.driverName,
        driverPhone: ambulance.driverPhone,
        vehicleNumber: ambulance.vehicleNumber,
        vehicleType: ambulance.vehicleType,
        status: ambulance.status,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getDriverProfile = async (req, res) => {
  try {
    const ambulance = await Ambulance.findById(req.user.id).select("-password");
    if (!ambulance) {
      return res.status(404).json({
        success: false,
        message: "Ambulance driver not found",
      });
    }

    const assignedEmergency = await getAssignedEmergencyForDriver(ambulance._id);

    res.status(200).json({
      success: true,
      ambulance,
      emergency: assignedEmergency || null,
    });
  } catch (error) {
    console.error("Get driver profile failed", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getCurrentEmergency = async (req, res) => {
  try {
    const emergency = await getAssignedEmergencyForDriver(req.user.id);
    return res.status(200).json({
      success: true,
      emergency: emergency || null,
    });
  } catch (error) {
    console.error("Get current emergency failed", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.acceptTrip = async (req, res) => {
  try {
    const emergency = await Emergency.findById(req.params.id);
    if (!emergency) {
      return res.status(404).json({ success: false, message: "Emergency not found" });
    }

    if (!emergency.ambulance || emergency.ambulance.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "This trip is not assigned to you" });
    }

    if (emergency.status !== "ambulance_assigned") {
      return res.status(400).json({ success: false, message: "Trip is not ready for driver acceptance" });
    }

    emergency.status = "driver_accepted";
    emergency.driverStatus = "Accepted";
    emergency.assignmentHistory.push({
      hospital: emergency.assignedHospital,
      action: "trip_accepted",
      createdAt: new Date(),
    });

    await emergency.save();

    const populatedEmergency = await populateAssignedEmergency({ _id: emergency._id });
    res.status(200).json({ success: true, message: "Trip accepted successfully", emergency: populatedEmergency });
  } catch (error) {
    console.error("Accept trip failed", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.startTrip = async (req, res) => {
  try {
    const emergency = await Emergency.findById(req.params.id);
    if (!emergency) {
      return res.status(404).json({ success: false, message: "Emergency not found" });
    }

    if (!emergency.ambulance || emergency.ambulance.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "This trip is not assigned to you" });
    }

    if (emergency.status !== "driver_accepted") {
      return res.status(400).json({ success: false, message: "Trip cannot be started in the current state" });
    }

    emergency.status = "driver_on_the_way";
    emergency.driverStatus = "On The Way";
    emergency.assignmentHistory.push({
      hospital: emergency.assignedHospital,
      action: "trip_started",
      createdAt: new Date(),
    });

    await emergency.save();

    const populatedEmergency = await populateAssignedEmergency({ _id: emergency._id });
    res.status(200).json({ success: true, message: "Trip started successfully", emergency: populatedEmergency });
  } catch (error) {
    console.error("Start trip failed", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.completeTrip = async (req, res) => {
  try {
    const emergency = await Emergency.findById(req.params.id);
    if (!emergency) {
      return res.status(404).json({ success: false, message: "Emergency not found" });
    }

    if (!emergency.ambulance || emergency.ambulance.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "This trip is not assigned to you" });
    }

    if (emergency.status !== "driver_on_the_way") {
      return res.status(400).json({ success: false, message: "Trip cannot be completed in the current state" });
    }

    emergency.status = "completed";
    emergency.driverStatus = "Completed";
    emergency.ambulanceAssigned = false;
    emergency.assignmentHistory.push({
      hospital: emergency.assignedHospital,
      action: "trip_completed",
      createdAt: new Date(),
    });

    await emergency.save();

    const ambulance = await Ambulance.findById(emergency.ambulance);
    if (ambulance) {
      ambulance.status = "Available";
      await ambulance.save();
    }

    if (emergency.assignedHospital) {
      const hospital = await Hospital.findById(emergency.assignedHospital);
      if (hospital) {
        hospital.availableAmbulances = (hospital.availableAmbulances || 0) + 1;
        await hospital.save();
      }
    }

    const populatedEmergency = await populateAssignedEmergency({ _id: emergency._id });
    res.status(200).json({ success: true, message: "Trip completed successfully", emergency: populatedEmergency });
  } catch (error) {
    console.error("Complete trip failed", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
