const mongoose = require("mongoose");

const ReportItemSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    feedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Feed",
      required: true,
    },

    timeSpent: {
      type: String, // "HH:MM" format
      required: true,
    },

    description: {
      type: String,
      trim: true,
      required: true,
    },

    taskType: {
      type: String,
      default: "other",
    },
  },
  { _id: false }
);

const WorkReportSchema = new mongoose.Schema(
  {
    developerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    workDate: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },

    reports: [ReportItemSchema],

    totalTime: {
      type: String, // "HH:MM" format
      default: "00:00",
    },
  },
  {
    timestamps: true,
  }
);

/* ✅ Ensure one document per developer per day */
WorkReportSchema.index({ developerId: 1, workDate: 1 }, { unique: true });

module.exports = mongoose.model("WorkReport", WorkReportSchema);
