const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Ambulance = require("../models/Ambulance");
const Hospital = require("../models/Hospital");

exports.driverLogin = async (req, res) => {
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
      token,
      ambulance: {
        id: ambulance._id,
        hospital: ambulance.hospital,
        driverName: ambulance.driverName,
        driverPhone: ambulance.driverPhone,
        vehicleNumber: ambulance.vehicleNumber,
        vehicleType: ambulance.vehicleType,
        status: ambulance.status,
        email: ambulance.email,
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

exports.createAmbulance = async (req, res) => {
  try {
    if (req.user.role !== "hospital") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Hospitals only.",
      });
    }

    const hospital = await Hospital.findOne({ user: req.user.id });
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    const {
      driverName,
      driverPhone,
      email,
      password,
      vehicleNumber,
      vehicleType,
      status,
    } = req.body;

    if (
      !driverName ||
      !driverPhone ||
      !email ||
      !password ||
      !vehicleNumber ||
      !vehicleType ||
      !status
    ) {
      return res.status(400).json({
        success: false,
        message: "All ambulance fields and authentication fields are required",
      });
    }

    const existingAmbulance = await Ambulance.findOne({ email });
    if (existingAmbulance) {
      return res.status(400).json({
        success: false,
        message: "Ambulance email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const ambulance = await Ambulance.create({
      hospital: hospital._id,
      email,
      password: hashedPassword,
      driverName,
      driverPhone,
      vehicleNumber,
      vehicleType,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Ambulance created successfully",
      ambulance,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getMyAmbulances = async (req, res) => {
  try {
    if (req.user.role !== "hospital") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Hospitals only.",
      });
    }

    const hospital = await Hospital.findOne({ user: req.user.id });
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    const ambulances = await Ambulance.find({ hospital: hospital._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: ambulances.length,
      ambulances,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateAmbulance = async (req, res) => {
  try {
    if (req.user.role !== "hospital") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Hospitals only.",
      });
    }

    const hospital = await Hospital.findOne({ user: req.user.id });
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    const ambulance = await Ambulance.findById(req.params.id);
    if (!ambulance) {
      return res.status(404).json({
        success: false,
        message: "Ambulance not found",
      });
    }

    if (ambulance.hospital.toString() !== hospital._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this ambulance",
      });
    }

    const {
      driverName,
      driverPhone,
      email,
      password,
      vehicleNumber,
      vehicleType,
      status,
    } = req.body;

    const updates = {};
    if (driverName !== undefined) updates.driverName = driverName;
    if (driverPhone !== undefined) updates.driverPhone = driverPhone;
    if (email !== undefined) updates.email = email;
    if (vehicleNumber !== undefined) updates.vehicleNumber = vehicleNumber;
    if (vehicleType !== undefined) updates.vehicleType = vehicleType;
    if (status !== undefined) updates.status = status;
    if (password !== undefined) updates.password = await bcrypt.hash(password, 10);

    const updatedAmbulance = await Ambulance.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });

    res.status(200).json({
      success: true,
      message: "Ambulance updated successfully",
      ambulance: updatedAmbulance,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.resetDriverPassword = async (req, res) => {
  try {
    if (req.user.role !== "hospital") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Hospitals only.",
      });
    }

    const hospital = await Hospital.findOne({ user: req.user.id });
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    const ambulance = await Ambulance.findById(req.params.id);
    if (!ambulance) {
      return res.status(404).json({
        success: false,
        message: "Ambulance not found",
      });
    }

    if (ambulance.hospital.toString() !== hospital._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to reset this driver's password",
      });
    }

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({
        success: false,
        message: "New password is required",
      });
    }

    ambulance.password = await bcrypt.hash(password, 10);
    await ambulance.save();

    res.status(200).json({
      success: true,
      message: "Driver password reset successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteAmbulance = async (req, res) => {
  try {
    if (req.user.role !== "hospital") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Hospitals only.",
      });
    }

    const hospital = await Hospital.findOne({ user: req.user.id });
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    const ambulance = await Ambulance.findById(req.params.id);
    if (!ambulance) {
      return res.status(404).json({
        success: false,
        message: "Ambulance not found",
      });
    }

    if (ambulance.hospital.toString() !== hospital._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete this ambulance",
      });
    }

    await ambulance.remove();

    res.status(200).json({
      success: true,
      message: "Ambulance deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
