const mongoose = require("mongoose");

const ProjectActivityLogSchema = new mongoose.Schema(
  {
    ActionUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    ActionUserName: {
      type: String,
      required: true,
    },

    actionTitle: {
      type: String,
      required: true,
      trim: true,
    },

    oldData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    newData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    feedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Feeds",
      required: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: false }
);

ProjectActivityLogSchema.index({ projectId: 1, createdAt: -1 });

module.exports = mongoose.model(
  "FeedActivityLog",
  ProjectActivityLogSchema
);