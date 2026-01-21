const mongoose = require("mongoose");

const escalationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 150,
  },

  description: {
    type: String,
    trim: true,
  },

  department: {
    type: String,
    required: true,
    enum: ["Development", "QA", "Client Success", "Sales", "R&D"],
  },

  priority: {
    type: String,
    required: true,
    default: "P2 - Medium",
  },

  assignTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  assignToName: {
    type: String,
    required: true,
  },
  watchers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],

  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true,
  },

  feed: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Feed",
  },

  status: {
    type: String,
    enum: ["Open", "In Progress", "Resolved", "Closed"],
    default: "Open",
  },

  // Severity: {
  //   type: String
  // },

  SLADate: {
    type: String,
  },

  /**
   * 🔹 Closure / RCA Details
   */
  closureDetails: {
    rootCauseCategory: {
      type: String,
    },

    rcaMethod: {
      type: String,
    },

    rcaDescription: {
      type: String,
      trim: true,
    },

    correctiveActionDescription: {
      type: String,
      trim: true,
    },

    actionType: {
      type: String,
    },

    actionOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    dateImplemented: {
      type: String,
    },

    fixVerificationMethod: {
      type: String,
    },

    preventiveActionDescription: {
      type: String,
      trim: true,
    },

    preventiveActionType: {
      type: String,
    },

    preventiveActionOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    targetCompletionDate: {
      type: String,
    },

    preventiveActionStatus: {
      type: String,
    },

    slaBreachReason: {
      type: String,
      trim: true,
    },
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdbyName: {
    type: String,
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  closedAt: {
    type: Date,
  },
});

module.exports = mongoose.model("Escalations", escalationSchema);
