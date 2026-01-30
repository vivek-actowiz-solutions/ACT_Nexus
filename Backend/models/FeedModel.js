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
    feedPriority: {
      type: String,
    },
    frameworkType: {
      type: String,
      default: null,
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

    // 🌍 Location Arrays (Multi-Select)
    countries: [
      {
        name: { type: String },
        code: { type: String },
      },
    ],
    states: [
      {
        name: { type: String },
        code: { type: String },
        countryCode: { type: String }, // Link to parent country
      },
    ],
    cities: [
      {
        name: { type: String },
        code: { type: String },
        stateCode: { type: String }, // Link to parent state
      },
    ],
    pincode: {
      type: String, // Comma separated values
    },

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
  },
);

module.exports = mongoose.model("Feed", feedSchema);
