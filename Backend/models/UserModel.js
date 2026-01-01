const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    password: {
      type: String,
      required: true,

    },

    originalPassword: {
      type: String,
      required: true,
      select: false
    },

    image: {
      type: String, // store image URL or filename
      default: null
    },

    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "roles",
      required: true
    },
    // RoleLevel: {
    //   type: Number,
    //   required: true
    // },

    designation: {
      type: String,
      required: true
    },

    department: {
      type: String,
      required: true
    },

    status: {
      type: Boolean,
      default: true
    },

    reportingTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    roleVersion: {
      type: Number,
      default: 0
    },

    hasSeenTour: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true 
  }
);

module.exports = mongoose.model("User", userSchema);
