const mongoose = require("mongoose");
const Emergency = require("../models/Emergency");
const Hospital = require("../models/Hospital");
const Ambulance = require("../models/Ambulance");
const { calculateDistance } = require("../utils/distance");

const isAssignedToHospital = (hospital, assignedHospital) => {
  if (!hospital || !assignedHospital) return false;

  const hospitalId = hospital._id?.toString?.() || hospital.toString?.();
  const assignedHospitalId = assignedHospital._id?.toString?.() || assignedHospital.toString?.();

  return Boolean(hospitalId && assignedHospitalId && hospitalId === assignedHospitalId);
};

const findExistingHospital = async (hospitalId) => {
  if (!hospitalId) return null;
  if (!mongoose.Types.ObjectId.isValid(hospitalId)) return null;
  return Hospital.findById(hospitalId);
};

const getNextValidHospitalFromQueue = async (emergency) => {
  const queue = Array.isArray(emergency.hospitalQueue) ? emergency.hospitalQueue : [];
  const startIndex = Number.isInteger(emergency.currentHospitalIndex) && emergency.currentHospitalIndex >= 0
    ? emergency.currentHospitalIndex
    : 0;

  for (let idx = startIndex; idx < queue.length; idx += 1) {
    const hospital = await findExistingHospital(queue[idx]);
    if (!hospital) continue;
    if (!hospital.isOnline || hospital.availableBeds <= 0 || hospital.availableAmbulances <= 0) continue;
    return { hospital, index: idx };
  }

  return null;
};

const resolveAssignedHospital = async (emergency) => {
  const currentAssigned = await findExistingHospital(emergency.assignedHospital);
  if (currentAssigned) {
    return { hospital: currentAssigned, updated: false };
  }

  const nextValid = await getNextValidHospitalFromQueue(emergency);
  if (nextValid) {
    emergency.assignedHospital = nextValid.hospital._id;
    emergency.currentHospitalIndex = nextValid.index;
    await emergency.save();
    return { hospital: nextValid.hospital, updated: true };
  }

  return { hospital: null, updated: false };
};

const getHospitalRankings = async (latitude, longitude) => {
  const hospitals = await Hospital.find({
    isOnline: true,
    availableBeds: { $gt: 0 },
    availableAmbulances: { $gt: 0 },
  });

  return hospitals
    .map((hospital) => ({
      hospital,
      distance: calculateDistance(
        latitude,
        longitude,
        hospital.location.latitude,
        hospital.location.longitude
      ),
    }))
    .sort((a, b) => {
      if (a.distance !== b.distance) {
        return a.distance - b.distance;
      }
      if (b.hospital.availableBeds !== a.hospital.availableBeds) {
        return b.hospital.availableBeds - a.hospital.availableBeds;
      }
      return b.hospital.availableAmbulances - a.hospital.availableAmbulances;
    });
};

// Create Emergency
exports.createEmergency = async (req, res) => {
  try {
    const { latitude, longitude, emergencyType } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and Longitude are required",
      });
    }

    const rankings = await getHospitalRankings(latitude, longitude);
    const sortedHospitals = rankings.map((entry) => entry.hospital);
    const firstHospital = sortedHospitals[0] || null;
    const firstDistance = rankings[0]?.distance || 0;

    const emergency = await Emergency.create({
      user: req.user.id,
      latitude,
      longitude,
      status: firstHospital ? "waiting_for_acceptance" : "completed",
      assignedHospital: firstHospital ? firstHospital._id : null,
      hospitalQueue: sortedHospitals.map((hospital) => hospital._id),
      currentHospitalIndex: firstHospital ? 0 : -1,
      assignmentHistory: firstHospital
        ? [
            {
              hospital: firstHospital._id,
              action: "queued",
              createdAt: new Date(),
            },
          ]
        : [],
      distance: firstDistance,
      emergencyType: emergencyType || "General",
    });

    const populatedEmergency = await Emergency.findById(emergency._id)
      .populate("assignedHospital")
      .populate("ambulance")
      .populate("user", "name phone bloodGroup emergencyContact");

    return res.status(201).json({
      success: true,
      message: firstHospital ? "Emergency Request Sent Successfully" : "No suitable hospital available",
      emergency: populatedEmergency,
      assignedHospital: firstHospital,
    });
  } catch (error) {
    console.error("Create Emergency Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create emergency",
    });
  }
};

// Get Pending Emergencies (Fixed - Hospital Specific)
exports.getPendingEmergencies = async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ user: req.user.id });
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    const staleEmergencies = await Emergency.find({
      status: "waiting_for_acceptance",
      assignedHospital: { $ne: null },
    });

    await Promise.all(
      staleEmergencies.map(async (emergency) => {
        if (!emergency.assignedHospital) return;
        const assignedHospital = await findExistingHospital(emergency.assignedHospital);
        if (!assignedHospital) {
          await resolveAssignedHospital(emergency);
        }
      })
    );

    const emergencies = await Emergency.find({
      status: "waiting_for_acceptance",
      assignedHospital: hospital._id,
    })
      .populate("user", "name bloodGroup phone emergencyContact")
      .populate(
        "assignedHospital",
        "name address availableBeds availableAmbulances location"
      );

    res.status(200).json({
      success: true,
      count: emergencies.length,
      emergencies,
    });
  } catch (error) {
    console.error("Get Pending Emergencies Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Accept Emergency (With Debug Logs)
exports.acceptEmergency = async (req, res) => {
  try {
    console.log("✓ acceptEmergency start");
    console.log("✓ req.user.role", req.user?.role);
    if (req.user?.role !== "hospital") {
      console.log("✗ Invalid role, must be hospital");
      return res.status(403).json({
        success: false,
        message: "Access denied. Hospitals only.",
      });
    }

    const emergency = await Emergency.findById(req.params.id);
    console.log("✓ Emergency Loaded", emergency);

    if (!emergency) {
      console.log("✗ Emergency not found");
      return res.status(404).json({
        success: false,
        message: "Emergency not found",
      });
    }
    console.log("✓ emergency.status", emergency.status);
    console.log("✓ emergency.assignedHospital", emergency.assignedHospital);

    if (emergency.status !== "waiting_for_acceptance") {
      console.log("✗ Emergency already processed");
      return res.status(400).json({
        success: false,
        message: "Emergency is already processed",
      });
    }

    const hospital = await Hospital.findOne({ user: req.user.id });
    console.log("✓ Hospital Loaded", hospital ? { _id: hospital._id?.toString(), user: hospital.user?.toString() } : hospital);

    if (!hospital) {
      console.log("✗ Hospital not found");
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    const emergencyAssignedId = emergency.assignedHospital?.toString?.();
    const hospitalId = hospital._id?.toString?.();
    console.log("✓ hospital._id", hospitalId);
    console.log("✓ emergency.assignedHospital", emergencyAssignedId);
    console.log("✓ Ownership comparison", hospitalId, emergencyAssignedId, hospitalId === emergencyAssignedId);

    const { hospital: resolvedHospital, updated } = await resolveAssignedHospital(emergency);
    console.log("✓ resolveAssignedHospital result", {
      resolvedHospital: resolvedHospital ? { _id: resolvedHospital._id?.toString() } : null,
      updated,
    });

    if (!resolvedHospital) {
      console.log("✗ Assigned hospital no longer available");
      return res.status(404).json({
        success: false,
        message: "Assigned hospital for this emergency is no longer available",
      });
    }

    if (!isAssignedToHospital(hospital, resolvedHospital._id || resolvedHospital)) {
      console.log("✗ Ownership mismatch");
      return res.status(403).json({
        success: false,
        message: "This emergency is not assigned to your hospital",
      });
    }
    console.log("✓ Ownership Verified");

    if (updated) {
      console.log("✓ reassigned hospital detected, updating history");
      emergency.assignmentHistory.push({
        hospital: resolvedHospital._id,
        action: "reassigned",
        createdAt: new Date(),
      });
      console.log("✓ assignmentHistory updated for reassignment");
    }

    console.log("✓ Updating status");
    emergency.status = "hospital_accepted";
    console.log("✓ Updating hospital reference");
    emergency.hospital = req.user.id;
    console.log("✓ Updating acceptedAt");
    emergency.acceptedAt = new Date();
    console.log("✓ Updating assignmentHistory");
    emergency.assignmentHistory.push({
      hospital: hospital._id,
      action: "accepted",
      createdAt: new Date(),
    });

    console.log("✓ Saving Emergency");
    await emergency.save();
    console.log("✓ Save Successful");

    const populatedEmergency = await Emergency.findById(emergency._id)
      .populate("assignedHospital")
      .populate("ambulance")
      .populate("user", "name phone bloodGroup");
    console.log("✓ Populated Emergency Loaded");

    res.status(200).json({
      success: true,
      message: "Emergency Accepted Successfully",
      emergency: populatedEmergency,
    });
  } catch (error) {
    console.error(error);
    console.error(error.stack);
    const lineMatch = error.stack?.split("\n")[1]?.match(/:(\d+):\d+/);
    const lineNumber = lineMatch?.[1] || "unknown";
    return res.status(500).json({
      success: false,
      error: error.message,
      line: lineNumber,
    });
  }
};

// Reject Emergency (Improved)
exports.rejectEmergency = async (req, res) => {
  try {
    const emergency = await Emergency.findById(req.params.id);

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: "Emergency not found",
      });
    }

    if (emergency.status !== "waiting_for_acceptance") {
      return res.status(400).json({
        success: false,
        message: "Emergency is already processed",
      });
    }

    const hospital = await Hospital.findOne({ user: req.user.id });
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    const { hospital: resolvedHospital, updated } = await resolveAssignedHospital(emergency);
    if (!resolvedHospital) {
      return res.status(404).json({
        success: false,
        message: "Assigned hospital for this emergency is no longer available",
      });
    }

    if (!isAssignedToHospital(hospital, resolvedHospital._id || resolvedHospital)) {
      return res.status(403).json({
        success: false,
        message: "This emergency is not assigned to your hospital",
      });
    }

    if (updated) {
      emergency.assignmentHistory.push({
        hospital: resolvedHospital._id,
        action: "reassigned",
        createdAt: new Date(),
      });
    }

    const queue = emergency.hospitalQueue || [];
    const currentIndex = emergency.currentHospitalIndex || 0;
    const nextIndex = currentIndex + 1;
    const nextHospitalId = queue[nextIndex];

    emergency.assignmentHistory.push({
      hospital: hospital._id,
      action: "rejected",
      createdAt: new Date(),
    });

    if (nextHospitalId) {
      const nextHospital = await findExistingHospital(nextHospitalId);
      if (nextHospital && nextHospital.isOnline && nextHospital.availableBeds > 0 && nextHospital.availableAmbulances > 0) {
        emergency.status = "waiting_for_acceptance";
        emergency.assignedHospital = nextHospital._id;
        emergency.currentHospitalIndex = nextIndex;
        emergency.distance = calculateDistance(
          emergency.latitude,
          emergency.longitude,
          nextHospital.location.latitude,
          nextHospital.location.longitude
        );
        emergency.assignmentHistory.push({
          hospital: nextHospital._id,
          action: "forwarded",
          createdAt: new Date(),
        });
        await emergency.save();

        const populatedEmergency = await Emergency.findById(emergency._id)
          .populate("assignedHospital")
          .populate("ambulance")
          .populate("user", "name phone bloodGroup");

        return res.status(200).json({
          success: true,
          message: "Emergency forwarded to next hospital",
          emergency: populatedEmergency,
        });
      }
    }

    emergency.status = "completed";
    emergency.assignmentHistory.push({
      hospital: hospital._id,
      action: "no_hospitals_remaining",
      createdAt: new Date(),
    });
    await emergency.save();

    res.status(200).json({
      success: true,
      message: "Emergency Rejected and no further hospitals available",
      emergency,
    });
  } catch (error) {
    console.error("Reject Emergency Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Assign Ambulance (Unchanged)
exports.assignAmbulance = async (req, res) => {
  try {
    const emergency = await Emergency.findById(req.params.id);

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: "Emergency not found",
      });
    }

    if (emergency.status !== "hospital_accepted") {
      return res.status(400).json({
        success: false,
        message: "Emergency is not awaiting ambulance assignment",
      });
    }

    const hospital = await Hospital.findOne({ user: req.user.id });
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    const ambulance = await Ambulance.findOne({
      hospital: hospital._id,
      status: "Available",
    }).sort({ createdAt: 1 });

    if (!ambulance) {
      return res.status(409).json({
        success: false,
        message: "No Ambulance Available",
      });
    }

    ambulance.status = "Busy";
    await ambulance.save();

    hospital.availableAmbulances = Math.max(hospital.availableAmbulances - 1, 0);
    await hospital.save();

    emergency.status = "ambulance_assigned";
    emergency.ambulance = ambulance._id;
    emergency.driverStatus = "Assigned";
    emergency.ambulanceAssigned = true;
    emergency.eta = emergency.eta || 15;
    emergency.assignmentHistory.push({
      hospital: hospital._id,
      action: "ambulance_assigned",
      createdAt: new Date(),
    });

    await emergency.save();

    const populatedEmergency = await Emergency.findById(emergency._id)
      .populate("assignedHospital")
      .populate("ambulance")
      .populate("user", "name phone bloodGroup");

    res.status(200).json({
      success: true,
      message: "Ambulance Assigned Successfully",
      emergency: populatedEmergency,
    });
  } catch (error) {
    console.error("Assign Ambulance Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getEmergencyStatus = async (req, res) => {
  try {
    const emergency = await Emergency.findOne({
      user: req.user.id,
      status: { $ne: "completed" },
    })
      .sort({ createdAt: -1 })
      .populate("assignedHospital")
      .populate("ambulance")
      .populate("user", "name phone bloodGroup emergencyContact");

    res.status(200).json({
      success: true,
      emergency,
    });
  } catch (error) {
    console.error("Get Emergency Status Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};