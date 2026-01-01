
const ProjectActivityLog = require("../models/ProjectActivityLog");

const logProjectActivity = async ({
  userid,
  username,
  projectId,
  actionTitle,
  oldData = null,
  newData = null,
}) => {
  try {
    await ProjectActivityLog.create({
      ActionUserId: userid,
      ActionUserName: username,
      projectId,
      actionTitle,
      oldData,
      newData,
    });
  } catch (error) {
    console.error("Activity log error:", error.message);
  }
};

module.exports = logProjectActivity;