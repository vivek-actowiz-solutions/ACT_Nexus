
const FeedActivityLog = require("../models/FeedActivityLog");

const logFeedActivity = async ({
  userid,
  username,
  projectId,
  feedId,
  actionTitle,
  oldData = null,
  newData = null,
}) => {
  try {
    await FeedActivityLog.create({
      ActionUserId: userid,
      ActionUserName: username,
      feedId,
      projectId,
      actionTitle,
      oldData,
      newData,
    });
  } catch (error) {
    console.error("Activity log error:", error.message);
  }
};

module.exports = logFeedActivity;