const project = require("../models/ProjectModel");
const Feed = require("../models/FeedModel");

const getProjectAndFeedCount = async (req, res) => {
  try {
    // 🔹 Project aggregation
    const projectResult = await project.aggregate([
      {
        $facet: {
          totalProjects: [{ $count: "count" }],
          statusWiseCount: [
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 }
              }
            },
            {
              $project: {
                _id: 0,
                status: "$_id",
                count: 1
              }
            }
          ]
        }
      }
    ]);

    // 🔹 Feed aggregation
    const feedResult = await Feed.aggregate([
      {
        $facet: {
          totalFeeds: [{ $count: "count" }],
          statusWiseCount: [
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 }
              }
            },
            {
              $project: {
                _id: 0,
                status: "$_id",
                count: 1
              }
            }
          ]
        }
      }
    ]);

    return res.status(200).json({
      success: true,

      projects: {
        total: projectResult[0]?.totalProjects[0]?.count || 0,
        statusWiseCount: projectResult[0]?.statusWiseCount || []
      },

      feeds: {
        total: feedResult[0]?.totalFeeds[0]?.count || 0,
        statusWiseCount: feedResult[0]?.statusWiseCount || []
      }
    });

  } catch (error) {
    console.error("Project & Feed count error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch project and feed counts",
      error: error.message
    });
  }
};

module.exports = {
  getProjectAndFeedCount
};
