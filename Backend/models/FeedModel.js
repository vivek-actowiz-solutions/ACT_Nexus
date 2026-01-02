const mongoose = require("mongoose");

const feedSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    feedName: {
      type: String,
      required: true,
    },
    feedCode: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: "pending",
    },

    // teamlead: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "User",
    // },

    developers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    platformName: {
      type: String,
      required: true,
    },

    // 🖥 Platform Type
    platformType: {
      type: String,
      required: true,
    },
    scopeType: {
      type: String,
      required: true,
    },
    frameworkType: {
      type: String,
      default: null
    },
    // 📅 Frequency
    feedfrequency: {
      frequencyType: {
        type: String,
        required: true,
      },
      firstDate: {
        type: String,
      },
      secondDate: {
        type: String,
      },
      deliveryTime: {
        type: String,
        required: true,
      },
      deliveryDay: {
        type: String,
      },
      deliveryDate: {
        type: String,
      },
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🌍 Country (single or multiple supported)
    countries: [
      {
        name: { type: String, required: true }, // India
        code: { type: String, required: true }, // IN
      },
    ],

    // 📝 Description / Additional Info
    description: {
      type: String,
      trim: true,
      default: "",
    },

    // ✅ Status
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // auto adds createdAt & updatedAt
  }
);

module.exports = mongoose.model("Feed", feedSchema);
