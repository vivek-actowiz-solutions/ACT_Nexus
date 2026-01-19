const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    projectName: {
      type: String,
      required: true,
      trim: true,
    },

    projectCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    status: {
      type: String,
      default: "New",
    },
    description: {
      type: String,
      trim: true,
    },
    sowDocument: {
      type: [String], // ✅ Array of file paths
      default: [],
    },

    inputDocument: {
      type: [String],
      default: [],
    },
    annotationDocument: {
      type: [String],
      default: [],
    },
    industryType: {
      type: String,
      trim: true,
    },

    deliveryType: {
      type: String,
      required: true,
    },
    deliveryMode: {
      type: String,
    },

    department: {
      type: String,
      required: true,
    },

    // projectPriority: {
    //   type: String,
    //   default: "Medium",
    // },

    projectFrequency: {
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
    projectManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    csprojectManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    projectTechManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    teamLead: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    developers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    projectCoordinator: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    bde: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    feedIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Feed",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Project", projectSchema);
