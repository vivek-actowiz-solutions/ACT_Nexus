const project = require("../models/ProjectModel");
const Feed = require("../models/FeedModel");
const moment = require("moment");
const mongoose = require("mongoose");

const getProjectAndFeedCount = async (req, res) => {
  try {
    const user = req.user;
    const userObjectId = new mongoose.Types.ObjectId(user.id);
    let projectMatch = {};

    // ================= ROLE BASED PROJECT CONDITIONS =================

    if (user?.Rolelevel === 3 && user?.department === "Development") {
      projectMatch = {
        department: "Development",
        $or: [
          { projectManager: userObjectId },
          { projectTechManager: userObjectId },
        ],
      };
    } else if (user?.Rolelevel === 3 && user?.department === "Client Success") {
      projectMatch = { csprojectManager: userObjectId };
    } else if (user?.Rolelevel === 4) {
      projectMatch = { projectCoordinator: userObjectId };
    } else if (user?.Rolelevel === 5) {
      projectMatch = { teamLead: { $in: [userObjectId] } };
    } else if (user?.Rolelevel === 6) {
      projectMatch = { developers: { $in: [userObjectId] } };
    } else if (user?.Rolelevel === 7) {
      projectMatch = {
        $or: [{ bde: userObjectId }, { createdBy: userObjectId }],
      };
    }

    // ================= PROJECT AGGREGATION =================
    console.log("projectMatch", projectMatch);
    const projectAgg = await project.aggregate([
      { $match: projectMatch },
      {
        $facet: {
          projectIds: [{ $project: { _id: 1 } }],
          total: [{ $count: "count" }],
          statusWiseCount: [
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 },
              },
            },
            {
              $project: {
                _id: 0,
                status: "$_id",
                count: 1,
              },
            },
          ],
        },
      },
    ]);

    const projectIds = projectAgg[0]?.projectIds.map((p) => p._id) || [];
    console.log("projectIds", projectIds);
    // ================= FEED AGGREGATION (BASED ON PROJECT IDS) =================

    const feedAgg = await Feed.aggregate([
      {
        $match: {
          projectId: { $in: projectIds },
        },
      },
      {
        $facet: {
          total: [{ $count: "count" }],
          statusWiseCount: [
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 },
              },
            },
            {
              $project: {
                _id: 0,
                status: "$_id",
                count: 1,
              },
            },
          ],
        },
      },
    ]);

    // ================= RESPONSE =================
    console.log("feedAgg", feedAgg);
    return res.status(200).json({
      success: true,

      projects: {
        total: projectAgg[0]?.total[0]?.count || 0,
        statusWiseCount: projectAgg[0]?.statusWiseCount || [],
      },

      feeds: {
        total: feedAgg[0]?.total[0]?.count || 0,
        statusWiseCount: feedAgg[0]?.statusWiseCount || [],
      },
    });
  } catch (error) {
    console.error("Project & Feed Count Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch project and feed counts",
      error: error.message,
    });
  }
};

// const getFeedFrequency = async (req, res) => {
//   try {
//     const {
//       filter,
//       startDate,
//       endDate,
//       frequencyType,
//       time,
//       page = 1,
//       limit = 10,
//     } = req.query;

//     const pageNum = parseInt(page);
//     const limitNum = parseInt(limit);
//     const skip = (pageNum - 1) * limitNum;

//     const IST_OFFSET = "+05:30";
//     let startMoment = moment().utcOffset(IST_OFFSET).startOf("day");
//     let endMoment = moment().utcOffset(IST_OFFSET).endOf("day");

//     /* ================= TIME FRAME ================= */
//     switch (filter) {
//       case "today":
//         // Default is today 00:00 to 23:59 IST
//         break;

//       case "tomorrow":
//         startMoment.add(1, "days");
//         endMoment.add(1, "days");
//         break;

//       case "thisWeek":
//         // Start of current week (Monday) to End of current week (Sunday)
//         startMoment.startOf("isoWeek");
//         endMoment.endOf("isoWeek");
//         break;

//       case "nextWeek":
//         startMoment.add(1, "week").startOf("isoWeek");
//         endMoment.add(1, "week").endOf("isoWeek");
//         break;

//       case "thisMonth":
//         startMoment.startOf("month");
//         endMoment.endOf("month");
//         break;

//       case "custom":
//         if (startDate && endDate) {
//           startMoment = moment(startDate).startOf("day");
//           endMoment = moment(endDate).endOf("day");
//         }
//         break;
//     }

//     const startJSDate = startMoment.toDate();
//     const endJSDate = endMoment.toDate();

//     // Pre-calculate valid Days of Week and Days of Month for the requested range
//     const validWeekDays = new Set();
//     const validMonthDays = new Set();

//     let current = startMoment.clone();

//     // Iterate through each day in the range to collect valid matching criteria
//     // Limit iteration to avoid infinite loops if range is huge (though pagination handles output, calculation needs limits)
//     // For typical dashboard usage (month/week view), this loop is small (max 31 days).
//     const maxDays = 366;
//     let daysCount = 0;

//     while (current.isSameOrBefore(endMoment) && daysCount < maxDays) {
//       validWeekDays.add(current.format("dddd")); // e.g., "Monday"
//       validMonthDays.add(current.date()); // e.g., 1, 15, 31
//       current.add(1, "day");
//       daysCount++;
//     }

//     // If range exceeds a month (e.g. custom long range), all DOMs might be valid,
//     // but the loop handles it by filling the Set.

//     const validWeekDaysArray = Array.from(validWeekDays);
//     const validMonthDaysArray = Array.from(validMonthDays);

//     /* ================= BASE MATCH ================= */
//     const baseMatch = { active: true };
//     if (frequencyType) baseMatch["feedfrequency.frequencyType"] = frequencyType;
//     if (time) baseMatch["feedfrequency.deliveryTime"] = time;

//     const pipeline = [
//       { $match: baseMatch },

//       {
//         $match: {
//           $expr: {
//             $or: [
//               /* DAILY → ALWAYS Matches (if range > 0) */
//               { $eq: ["$feedfrequency.frequencyType", "Daily"] },

//               /* WEEKLY & BI-WEEKLY → Check if Delivery Day is in Range */
//               {
//                 $and: [
//                   {
//                     $in: [
//                       "$feedfrequency.frequencyType",
//                       ["Weekly", "Bi-Weekly"],
//                     ],
//                   },
//                   {
//                     $gt: [
//                       {
//                         $size: {
//                           $setIntersection: [
//                             // Ensure deliveryDay is split into array if CSV
//                             {
//                               $split: [
//                                 { $ifNull: ["$feedfrequency.deliveryDay", ""] },
//                                 ",",
//                               ],
//                             },
//                             validWeekDaysArray,
//                           ],
//                         },
//                       },
//                       0,
//                     ],
//                   },
//                 ],
//               },

//               /* MONTHLY → Check if Delivery Date is in Range */
//               {
//                 $and: [
//                   { $eq: ["$feedfrequency.frequencyType", "Monthly"] },
//                   {
//                     $in: [
//                       { $toInt: "$feedfrequency.deliveryDate" },
//                       validMonthDaysArray,
//                     ],
//                   },
//                 ],
//               },

//               /* BI-MONTHLY → Check First or Second Date */
//               {
//                 $and: [
//                   { $eq: ["$feedfrequency.frequencyType", "Bi-Monthly"] },
//                   {
//                     $or: [
//                       {
//                         $in: [
//                           { $toInt: "$feedfrequency.firstDate" },
//                           validMonthDaysArray,
//                         ],
//                       },
//                       {
//                         $in: [
//                           { $toInt: "$feedfrequency.secondDate" },
//                           validMonthDaysArray,
//                         ],
//                       },
//                     ],
//                   },
//                 ],
//               },

//               /* CUSTOM → Precise Date Match */
//               {
//                 $and: [
//                   { $eq: ["$feedfrequency.frequencyType", "Custom"] },
//                   {
//                     $and: [
//                       {
//                         $gte: [
//                           {
//                             $dateFromString: {
//                               dateString: "$feedfrequency.deliveryDate",
//                             },
//                           },
//                           startJSDate,
//                         ],
//                       },
//                       {
//                         $lte: [
//                           {
//                             $dateFromString: {
//                               dateString: "$feedfrequency.deliveryDate",
//                             },
//                           },
//                           endJSDate,
//                         ],
//                       },
//                     ],
//                   },
//                 ],
//               },
//             ],
//           },
//         },
//       },
//       // LOOKUP to join Project collection
//       {
//         $lookup: {
//           from: "projects", // your collection name for projects
//           localField: "projectId", // field in Feed collection
//           foreignField: "_id", // field in Project collection
//           as: "projectInfo", // output array
//         },
//       },

//       // Optionally unwind if you only expect one project per feed
//       { $unwind: { path: "$projectInfo", preserveNullAndEmptyArrays: true } },

//       {
//         $project: {
//           _id: 0,
//           feedName: 1,
//           platformName: 1,
//           status: 1,
//           feedfrequency: 1,
//           projectName: "$projectInfo.projectName", // project name from Project collection
//           // Debug fields (optional, remove in prod if needed)
//           // matchType: "$feedfrequency.frequencyType"
//         },
//       },

//       {
//         $facet: {
//           metadata: [{ $count: "total" }],
//           data: [{ $skip: skip }, { $limit: limitNum }],
//         },
//       },
//     ];

//     const result = await Feed.aggregate(pipeline);

//     // Extract data and total count
//     const data = result[0].data || [];
//     const totalCount = result[0].metadata[0] ? result[0].metadata[0].total : 0;

//     return res.json({
//       success: true,
//       count: totalCount,
//       data: data,
//       page: pageNum,
//       limit: limitNum,
//       // Returning debug info about partial date matching
//       filterApplied: {
//         matchStart: startMoment.format(),
//         matchEnd: endMoment.format(),
//         validDays: validWeekDaysArray,
//       },
//     });
//   } catch (error) {
//     console.error("Feed frequency filter error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Feed frequency filter failed",
//       error: error.message,
//     });
//   }
// };
const getFeedFrequency = async (req, res) => {
  try {
    /* ================= USER ================= */
    const user = req.user;
    const userObjectId = new mongoose.Types.ObjectId(user.id);

    /* ================= QUERY PARAMS ================= */
    const {
      filter,
      startDate,
      endDate,
      frequencyType,
      time,
      page = 1,
      limit = 10,
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    /* ================= ROLE BASED PROJECT MATCH ================= */
    let projectMatch = {};

    if (user?.Rolelevel === 3 && user?.department === "Development") {
      projectMatch = {
        department: "Development",
        $or: [
          { projectManager: userObjectId },
          { projectTechManager: userObjectId },
        ],
      };
    } else if (user?.Rolelevel === 3 && user?.department === "Client Success") {
      projectMatch = { csprojectManager: userObjectId };
    } else if (user?.Rolelevel === 4) {
      projectMatch = { projectCoordinator: userObjectId };
    } else if (user?.Rolelevel === 5) {
      projectMatch = { teamLead: { $in: [userObjectId] } };
    } else if (user?.Rolelevel === 6) {
      projectMatch = { developers: { $in: [userObjectId] } };
    } else if (user?.Rolelevel === 7) {
      projectMatch = {
        $or: [{ bde: userObjectId }, { createdBy: userObjectId }],
      };
    }

    /* ================= FETCH ALLOWED PROJECTS ================= */
    const projects = await project.find(projectMatch).select("_id");
    const projectIds = projects.map((p) => p._id);

    if (!projectIds.length) {
      return res.json({
        success: true,
        count: 0,
        data: [],
        page: pageNum,
        limit: limitNum,
      });
    }

    /* ================= DATE RANGE (IST) ================= */
    const IST_OFFSET = "+05:30";
    let startMoment = moment().utcOffset(IST_OFFSET).startOf("day");
    let endMoment = moment().utcOffset(IST_OFFSET).endOf("day");

    switch (filter) {
      case "tomorrow":
        startMoment.add(1, "day");
        endMoment.add(1, "day");
        break;
      case "thisWeek":
        startMoment.startOf("isoWeek");
        endMoment.endOf("isoWeek");
        break;
      case "nextWeek":
        startMoment.add(1, "week").startOf("isoWeek");
        endMoment.add(1, "week").endOf("isoWeek");
        break;
      case "thisMonth":
        startMoment.startOf("month");
        endMoment.endOf("month");
        break;
      case "custom":
        if (startDate && endDate) {
          startMoment = moment(startDate).startOf("day");
          endMoment = moment(endDate).endOf("day");
        }
        break;
    }

    const startJSDate = startMoment.toDate();
    const endJSDate = endMoment.toDate();

    /* ================= VALID DAYS ================= */
    const validWeekDays = new Set();
    const validMonthDays = new Set();

    let current = startMoment.clone();
    let daysCount = 0;

    while (current.isSameOrBefore(endMoment) && daysCount < 366) {
      validWeekDays.add(current.format("dddd"));
      validMonthDays.add(current.date());
      current.add(1, "day");
      daysCount++;
    }

    const validWeekDaysArray = [...validWeekDays];
    const validMonthDaysArray = [...validMonthDays];

    /* ================= FEED MATCH ================= */
    const baseMatch = {
      active: true,
      projectId: { $in: projectIds },
    };

    if (frequencyType) baseMatch["feedfrequency.frequencyType"] = frequencyType;
    if (time) baseMatch["feedfrequency.deliveryTime"] = time;

    /* ================= AGGREGATION ================= */
    const pipeline = [
      { $match: baseMatch },

      {
        $match: {
          $expr: {
            $or: [
              { $eq: ["$feedfrequency.frequencyType", "Daily"] },

              {
                $and: [
                  {
                    $in: [
                      "$feedfrequency.frequencyType",
                      ["Weekly", "Bi-Weekly"],
                    ],
                  },
                  {
                    $gt: [
                      {
                        $size: {
                          $setIntersection: [
                            {
                              $split: [
                                { $ifNull: ["$feedfrequency.deliveryDay", ""] },
                                ",",
                              ],
                            },
                            validWeekDaysArray,
                          ],
                        },
                      },
                      0,
                    ],
                  },
                ],
              },

              {
                $and: [
                  { $eq: ["$feedfrequency.frequencyType", "Monthly"] },
                  {
                    $in: [
                      { $toInt: "$feedfrequency.deliveryDate" },
                      validMonthDaysArray,
                    ],
                  },
                ],
              },

              {
                $and: [
                  { $eq: ["$feedfrequency.frequencyType", "Bi-Monthly"] },
                  {
                    $or: [
                      {
                        $in: [
                          { $toInt: "$feedfrequency.firstDate" },
                          validMonthDaysArray,
                        ],
                      },
                      {
                        $in: [
                          { $toInt: "$feedfrequency.secondDate" },
                          validMonthDaysArray,
                        ],
                      },
                    ],
                  },
                ],
              },

              {
                $and: [
                  { $eq: ["$feedfrequency.frequencyType", "Custom"] },
                  {
                    $and: [
                      {
                        $gte: [
                          {
                            $dateFromString: {
                              dateString: "$feedfrequency.deliveryDate",
                            },
                          },
                          startJSDate,
                        ],
                      },
                      {
                        $lte: [
                          {
                            $dateFromString: {
                              dateString: "$feedfrequency.deliveryDate",
                            },
                          },
                          endJSDate,
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      },

      {
        $lookup: {
          from: "projects",
          localField: "projectId",
          foreignField: "_id",
          as: "projectInfo",
        },
      },
      { $unwind: "$projectInfo" },

      {
        $project: {
          feedName: 1,
          platformName: 1,
          status: 1,
          feedfrequency: 1,
          projectName: "$projectInfo.projectName",
        },
      },

      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: skip }, { $limit: limitNum }],
        },
      },
    ];

    const result = await Feed.aggregate(pipeline);

    return res.json({
      success: true,
      count: result[0]?.metadata[0]?.total || 0,
      data: result[0]?.data || [],
      page: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    console.error("Feed frequency error:", error);
    res.status(500).json({
      success: false,
      message: "Feed frequency fetch failed",
    });
  }
};
module.exports = {
  getProjectAndFeedCount,
  getFeedFrequency,
};
