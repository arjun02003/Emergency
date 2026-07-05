const mongoose = require("mongoose");

const emergencySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    latitude: {
      type: Number,
      required: true,
    },

    longitude: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "idle",
        "locating",
        "searching",
        "hospital_found",
        "waiting_for_acceptance",
        "hospital_accepted",
        "ambulance_assigned",
        "driver_accepted",
        "driver_on_the_way",
        "completed",
        "pending",
        "accepted",
        "rejected",
        "Ambulance Assigned",
      ],
      default: "idle",
    },

    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    ambulanceAssigned: {
      type: Boolean,
      default: false,
    },

    ambulance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ambulance",
    },

    driverStatus: {
      type: String,
      default: "Pending",
    },

    assignedHospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
    },

    hospitalQueue: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hospital",
      },
    ],

    currentHospitalIndex: {
      type: Number,
      default: 0,
    },

    assignmentHistory: [
      {
        hospital: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Hospital",
        },
        action: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    distance: {
      type: Number,
      default: 0,
    },

    eta: {
      type: Number,
      default: 0,
    },

    acceptedAt: {
      type: Date,
    },

    emergencyType: {
      type: String,
      default: "General",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Emergency", emergencySchema);