const axios = require("axios");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const Hospital = require("../models/Hospital");
const Emergency = require("../models/Emergency");

exports.getAdminDashboardData = async (req, res) => {
  try {
    const [totalUsers, totalHospitals, hospitalsOnline, hospitalsOffline, activeSosRequests, hospitals, activeEmergencies] = await Promise.all([
      User.countDocuments({ role: "user" }),
      Hospital.countDocuments(),
      Hospital.countDocuments({ isOnline: true }),
      Hospital.countDocuments({ isOnline: false }),
      Emergency.countDocuments({ status: { $nin: ["completed", "rejected"] } }),
      Hospital.find().sort({ createdAt: -1 }),
      Emergency.find({ status: { $nin: ["completed", "rejected"] } })
        .sort({ createdAt: -1 })
        .limit(8)
        .populate("user", "name phone")
        .populate("assignedHospital", "name"),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalHospitals,
        hospitalsOnline,
        hospitalsOffline,
        activeSosRequests,
      },
      hospitals,
      activeEmergencies,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.createHospital = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      address,
      emergencyTypes,
      totalBeds,
      availableBeds,
      totalAmbulances,
      availableAmbulances,
    } = req.body;

    const normalizedName = typeof name === "string" ? name.trim() : "";
    const normalizedEmail = typeof email === "string" ? email.trim() : "";
    const normalizedPhone = typeof phone === "string" ? phone.trim() : "";
    const normalizedAddress = typeof address === "string" ? address.trim() : "";
    const normalizedEmergencyTypes = Array.isArray(emergencyTypes)
      ? emergencyTypes.map((item) => String(item).trim()).filter(Boolean)
      : typeof emergencyTypes === "string"
      ? emergencyTypes.split(",").map((item) => item.trim()).filter(Boolean)
      : [];

    const totalBedsCount = Number(totalBeds) || 0;
    const availableBedsCount = Number(availableBeds) || 0;
    const totalAmbulancesCount = Number(totalAmbulances) || 0;
    const availableAmbulancesCount = Number(availableAmbulances) || 0;

    const requiredFields = {
      name: normalizedName,
      email: normalizedEmail,
      phone: normalizedPhone,
      address: normalizedAddress,
      emergencyTypes: normalizedEmergencyTypes,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => {
        if (Array.isArray(value)) {
          return value.length === 0;
        }
        return !value || (typeof value === "string" && value.trim() === "");
      })
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    const mapboxKey = process.env.MAPBOX_API_KEY;
    const geocodingApiKey = process.env.GOOGLE_MAPS_API_KEY;

    let latitudeValue = null;
    let longitudeValue = null;

    if (mapboxKey) {
      // Use Mapbox Geocoding API
      try {
        const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(normalizedAddress)}.json?access_token=${mapboxKey}&limit=1`;
        const mapResp = await axios.get(mapboxUrl);
        const mapData = mapResp.data;
        if (mapData && Array.isArray(mapData.features) && mapData.features.length > 0) {
          // Mapbox returns [lon, lat]
          const center = mapData.features[0].center;
          longitudeValue = Number(center[0]);
          latitudeValue = Number(center[1]);
        } else {
          return res.status(400).json({ success: false, message: "Invalid address. Please enter a valid hospital address." });
        }
      } catch (err) {
        console.warn('Mapbox geocoding failed:', err.message || err);
        // fallthrough to try Google or Nominatim below
      }
    }

    if ((latitudeValue === null || longitudeValue === null) && geocodingApiKey) {
      // Try Google Maps geocoding
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(normalizedAddress)}&key=${geocodingApiKey}`;
      const geocodeResponse = await axios.get(geocodeUrl);
      const geocodeData = geocodeResponse.data;

      if (geocodeData && geocodeData.status === "OK" && Array.isArray(geocodeData.results) && geocodeData.results.length > 0) {
        const location = geocodeData.results[0].geometry.location;
        latitudeValue = Number(location.lat);
        longitudeValue = Number(location.lng);
      }
    }

    if (latitudeValue === null || longitudeValue === null) {
      // Fall back to OpenStreetMap Nominatim
      try {
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(normalizedAddress)}`;
        const nomResp = await axios.get(nominatimUrl, {
          headers: { 'User-Agent': 'Suraksha-App/1.0 (contact: youremail@example.com)' },
        });
        const nomData = nomResp.data;
        if (Array.isArray(nomData) && nomData.length > 0) {
          latitudeValue = Number(nomData[0].lat);
          longitudeValue = Number(nomData[0].lon);
        } else {
          return res.status(400).json({
            success: false,
            message: "Invalid address. Please enter a valid hospital address.",
          });
        }
      } catch (err) {
        console.warn('Nominatim geocoding failed:', err.message || err);
        return res.status(500).json({ success: false, message: 'Geocoding failed. Please configure MAPBOX_API_KEY or GOOGLE_MAPS_API_KEY or try a different address.' });
      }
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Hospital email already exists",
      });
    }

    const generatedPassword = password && password.trim() ? null : `${crypto.randomBytes(4).toString("hex")}${Math.random().toString(36).slice(-4)}A!`;
    const passwordToUse = (password && password.trim()) ? password.trim() : generatedPassword;
    const hashedPassword = await bcrypt.hash(passwordToUse, 10);

    const hospitalUser = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      phone: normalizedPhone,
      password: hashedPassword,
      role: "hospital",
      hospitalLocation: {
        latitude: latitudeValue,
        longitude: longitudeValue,
      },
      isOnline: true,
      totalBeds: totalBedsCount,
      availableBeds: availableBedsCount,
      totalAmbulances: totalAmbulancesCount,
      availableAmbulances: availableAmbulancesCount,
    });

    const hospitalDoc = await Hospital.create({
      user: hospitalUser._id,
      name: normalizedName,
      email: normalizedEmail,
      phone: normalizedPhone,
      address: normalizedAddress,
      location: {
        latitude: latitudeValue,
        longitude: longitudeValue,
      },
      totalBeds: totalBedsCount,
      availableBeds: availableBedsCount,
      totalAmbulances: totalAmbulancesCount,
      availableAmbulances: availableAmbulancesCount,
      isOnline: true,
      emergencyTypes: normalizedEmergencyTypes,
    });

    return res.status(201).json({
      success: true,
      message: "Hospital created successfully",
      hospital: hospitalDoc,
      generatedPassword: generatedPassword,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update hospital (admin)
exports.updateHospital = async (req, res) => {
  try {
    const hospitalId = req.params.id;
    const { name, email, phone, address, emergencyTypes, isOnline, password } = req.body;

    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      return res.status(404).json({ success: false, message: "Hospital not found" });
    }

    // Update fields on Hospital
    if (name) hospital.name = name;
    if (email) hospital.email = email;
    if (phone) hospital.phone = phone;
    if (address) hospital.address = address;
    if (typeof isOnline === 'boolean') hospital.isOnline = isOnline;
    if (totalBeds !== undefined) hospital.totalBeds = Number(totalBeds);
    if (availableBeds !== undefined) hospital.availableBeds = Number(availableBeds);
    if (totalAmbulances !== undefined) hospital.totalAmbulances = Number(totalAmbulances);
    if (availableAmbulances !== undefined) hospital.availableAmbulances = Number(availableAmbulances);
    if (emergencyTypes) {
      hospital.emergencyTypes = Array.isArray(emergencyTypes)
        ? emergencyTypes.map((i) => String(i).trim()).filter(Boolean)
        : String(emergencyTypes).split(',').map((i) => i.trim()).filter(Boolean);
    }

    await hospital.save();

    // Keep User in sync
    if (hospital.user) {
      const userUpdates = {};
      if (name) userUpdates.name = name;
      if (email) userUpdates.email = email;
      if (phone) userUpdates.phone = phone;
      if (totalBeds !== undefined) userUpdates.totalBeds = Number(totalBeds);
      if (availableBeds !== undefined) userUpdates.availableBeds = Number(availableBeds);
      if (totalAmbulances !== undefined) userUpdates.totalAmbulances = Number(totalAmbulances);
      if (availableAmbulances !== undefined) userUpdates.availableAmbulances = Number(availableAmbulances);

      if (password && typeof password === "string" && password.trim().length > 0) {
        const hashedPassword = await bcrypt.hash(password.trim(), 10);
        userUpdates.password = hashedPassword;
      }

      if (Object.keys(userUpdates).length > 0) {
        await User.findByIdAndUpdate(hospital.user, userUpdates);
      }
    }

    return res.status(200).json({ success: true, message: 'Hospital updated successfully', hospital });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete hospital (admin)
exports.deleteHospital = async (req, res) => {
  try {
    const hospitalId = req.params.id;
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) return res.status(404).json({ success: false, message: 'Hospital not found' });

    // Remove hospital doc
    await Hospital.findByIdAndDelete(hospitalId);

    // Remove associated user if exists
    if (hospital.user) {
      await User.findByIdAndDelete(hospital.user);
    }

    return res.status(200).json({ success: true, message: 'Hospital deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Reset hospital password (admin) - returns generated password
exports.resetHospitalPassword = async (req, res) => {
  try {
    const hospitalId = req.params.id;
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) return res.status(404).json({ success: false, message: 'Hospital not found' });

    const user = await User.findById(hospital.user);
    if (!user) return res.status(404).json({ success: false, message: 'Associated user not found' });

    const newPassword = `${crypto.randomBytes(4).toString('hex')}${Math.random().toString(36).slice(-4)}A!`;
    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    return res.status(200).json({ success: true, message: 'Password reset successfully', generatedPassword: newPassword });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
