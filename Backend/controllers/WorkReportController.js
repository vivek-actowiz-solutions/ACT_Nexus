const WorkReport = require("../models/WorkReportModel");
const Feed = require("../models/FeedModel");
const Project = require("../models/ProjectModel");
const mongoose = require("mongoose");
const formatMinutesToHHMM = (totalMinutes) => {
  console.log("totalMinutes", totalMinutes);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}`;
};
const formatToHHMM = (hours, minutes) => {
  const h = Math.max(0, Math.min(23, Number(hours)));
  const m = Math.max(0, Math.min(59, Number(minutes)));

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};
const hhmmToMinutes = (time) => {
  if (!time || typeof time !== "string") return 0;

  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;

  return h * 60 + m;
};
const AddWorkReport = async (req, res) => {
  console.log("AddWorkReport called with body:", req.body);
  try {
    const { works } = req.body;
    const developerId = req.user?.id;

    if (!developerId) {
      return res.status(400).json({ message: "Developer ID is required" });
    }

    if (!Array.isArray(works) || works.length === 0) {
      return res.status(400).json({ message: "Works array is required" });
    }

    // Helper functions
    const hhmmToMinutes = (time) => {
      if (!time) return 0;
      const [h, m] = time.split(":").map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    const formatMinutesToHHMM = (minutes) => {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    };

    const formatToHHMM = (hours, minutes) =>
      formatMinutesToHHMM(Number(hours) * 60 + Number(minutes));

    /* 🔹 Group works by date */
    const groupedByDate = {};
    works.forEach((work) => {
      if (
        !work.workDate ||
        !work.projectId ||
        !work.feedId ||
        work.hours === undefined ||
        work.minutes === undefined
      ) {
        throw new Error("Missing required fields in work report");
      }

      if (!groupedByDate[work.workDate]) {
        groupedByDate[work.workDate] = [];
      }

      groupedByDate[work.workDate].push({
        projectId: new mongoose.Types.ObjectId(work.projectId),
        feedId: new mongoose.Types.ObjectId(work.feedId),
        timeSpent: formatToHHMM(work.hours, work.minutes),
        description: work.description?.trim() || "",
        taskType: work.taskType || "development",
      });
    });

    /* 🔹 Save per date (same dev + same date = one doc) */
    const operations = Object.entries(groupedByDate).map(
      async ([workDate, reports]) => {
        // Find existing document for this dev & date
        const reportDoc = await WorkReport.findOne({ developerId, workDate });

        // Calculate total minutes: existing + new
        const existingMinutes = reportDoc
          ? reportDoc.reports.reduce(
              (sum, r) => sum + hhmmToMinutes(r.timeSpent),
              0
            )
          : 0;

        const newMinutes = reports.reduce(
          (sum, r) => sum + hhmmToMinutes(r.timeSpent),
          0
        );

        const totalTime = formatMinutesToHHMM(existingMinutes + newMinutes);

        if (reportDoc) {
          // Document exists → push new reports and update totalTime
          reportDoc.reports.push(...reports);
          reportDoc.totalTime = totalTime;
          return reportDoc.save();
        } else {
          // No document → create new
          return WorkReport.create({
            developerId,
            workDate,
            reports,
            totalTime,
          });
        }
      }
    );

    await Promise.all(operations);

    res.status(201).json({
      success: true,
      message: "Work reports added successfully",
      datesProcessed: Object.keys(groupedByDate),
    });
  } catch (error) {
    console.error("AddWorkReport error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add work reports",
      error: error.message,
    });
  }
};
const updateWorkReport = async (req, res) => {
  console.log("updateWorkReport called with body:", req.body);

  try {
    const { works, developerId, date } = req.body;

    /* ---------------- VALIDATIONS ---------------- */

    if (!developerId) {
      return res.status(400).json({ message: "Developer ID is required" });
    }

    if (!date) {
      return res.status(400).json({ message: "Work date is required" });
    }

    if (!Array.isArray(works)) {
      return res.status(400).json({ message: "Works must be an array" });
    }

    /* ---------------- HELPERS ---------------- */

    const formatToHHMM = (hours, minutes) => {
      const totalMinutes = Number(hours) * 60 + Number(minutes);
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    };

    const hhmmToMinutes = (time) => {
      if (!time) return 0;
      const [h, m] = time.split(":").map(Number);
      return h * 60 + m;
    };

    /* ---------------- FORMAT REPORTS ---------------- */

    const reports = works.map((work) => {
      if (
        !work.projectId ||
        !work.feedId ||
        work.hours === undefined ||
        work.minutes === undefined
      ) {
        throw new Error("Invalid work entry data");
      }

      return {
        projectId: new mongoose.Types.ObjectId(work.projectId),
        feedId: new mongoose.Types.ObjectId(work.feedId),
        timeSpent: formatToHHMM(work.hours, work.minutes),
        description: work.description?.trim() || "",
        taskType: work.taskType || "development",
      };
    });

    /* ---------------- TOTAL TIME ---------------- */

    const totalMinutes = reports.reduce(
      (sum, r) => sum + hhmmToMinutes(r.timeSpent),
      0
    );

    const totalTime = formatToHHMM(
      Math.floor(totalMinutes / 60),
      totalMinutes % 60
    );

    /* ---------------- UPSERT WORK REPORT ---------------- */

    const updatedDoc = await WorkReport.findOneAndUpdate(
      { developerId, workDate: date },
      {
        $set: {
          reports,
          totalTime,
        },
      },
      {
        new: true,
        upsert: true, // create if not exists
      }
    );

    /* ---------------- RESPONSE ---------------- */

    res.status(200).json({
      success: true,
      message: "Work report updated successfully",
      data: updatedDoc,
    });
  } catch (error) {
    console.error("updateWorkReport error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update work report",
      error: error.message,
    });
  }
};

const GetWorkReports = async (req, res) => {
  const permission = res.locals.permissions;
  const Rolelevel = req.user.Rolelevel;
  const department = req.user.department;
  const userId = new mongoose.Types.ObjectId(req.user.id);

  try {
    let {
      search = "",
      fromDate,
      toDate,
      lastDays = 5,
      page = 1,
      limit = 10,
    } = req.query;

    page = Number(page);
    limit = Number(limit);
    const skip = (page - 1) * limit;

    /* ---------- Date Range ---------- */
    let startDate, endDate;

    if (fromDate && toDate) {
      startDate = new Date(fromDate);
      endDate = new Date(toDate);
    } else {
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(endDate.getDate() - (Number(lastDays) - 1));
    }

    /* ---------- Build Date List ---------- */
    const dateList = [];
    let tempDate = new Date(startDate);
    while (tempDate <= endDate) {
      dateList.push(tempDate.toISOString().slice(0, 10));
      tempDate.setDate(tempDate.getDate() + 1);
    }

    /* ---------- Role Based Developer Fetch ---------- */
    let developerFilter = {};

    // 🔹 Search
    if (search) {
      developerFilter.name = { $regex: search, $options: "i" };
    }
    const roles = await mongoose.connection.db
      .collection("roles")
      .find({ Rolelevel: { $in: [4 ,5, 6 ] } })
      .project({ _id: 1, Rolelevel: 1 })
      .toArray();

    developerFilter.roleId = { $in: roles.map((role) => role._id) };

    let developerIds = [];

    // 🔹 Developer (6) → Same TL team
    if (Rolelevel === 6) {
      const me = await mongoose.connection.db
        .collection("users")
        .findOne({ _id: userId }, { projection: { reportingTo: 1 } });

      developerFilter.reportingTo = me.reportingTo;
    }

    // 🔹 Team Lead (5) → Own developers
    if (Rolelevel === 5) {
      developerFilter.$or = [{ reportingTo: userId }, { _id: userId }];
    }

    // 🔹 Manager (3) → TLs → Developers
    if (Rolelevel === 3 && department === "Development") {
      const tls = await mongoose.connection.db
        .collection("users")
        .find({ reportingTo: userId })
        .project({ _id: 1 })
        .toArray();

      developerFilter.reportingTo = { $in: tls.map((tl) => tl._id) };
    }
    if (Rolelevel === 3 && department === "Client Success") {
      // const pc = await mongoose.connection.db
      //   .collection("users")
      //   .find({ reportingTo: userId })
      //   .project({ _id: 1 })
      //   .toArray();

      developerFilter.reportingTo = { $in: [userId] }; // { $in: pc.map((tl) => tl._id) };
    }
    if (Rolelevel === 4) {
      console.log("runnning this ");
      const me = await mongoose.connection.db
        .collection("users")
        .findOne({ _id: userId }, { projection: { reportingTo: 1 } });
      console.log("me", me);

      developerFilter.reportingTo = me.reportingTo; // { $in: pc.map((tl) => tl._id) };
    }

    const developers = await mongoose.connection.db
      .collection("users")
      .find(developerFilter)
      .project({ _id: 1, name: 1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    developerIds = developers.map((d) => d._id);

    const total = await mongoose.connection.db
      .collection("users")
      .countDocuments(developerFilter);
    console.log(total);
    /* ---------- Fetch Work Reports ---------- */
    const reports = await WorkReport.find({
      developerId: { $in: developerIds },
      workDate: {
        $gte: startDate.toISOString().slice(0, 10),
        $lte: endDate.toISOString().slice(0, 10),
      },
    }).lean();

    /* ---------- Group Reports ---------- */
    const reportMap = {};
    reports.forEach((r) => {
      if (!reportMap[r.developerId]) reportMap[r.developerId] = {};
      reportMap[r.developerId][r.workDate] = r.totalTime;
    });

    /* ---------- Final Response ---------- */
    const data = developers.map((dev) => ({
      developerId: dev._id,
      developerName: dev.name,
      workreport: dateList.map((date) => ({
        date,
        totalTime: reportMap[dev._id]?.[date] || "N/A",
      })),
    }));

    return res.status(200).json({
      success: true,
      data,
      total,
      permission,
    });
  } catch (error) {
    console.error("Work report error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch work reports",
    });
  }
};

const getprojectworkreport = async (req, res) => {
  console.log(req.query);
  const userId = req.user.id;
  console.log("userId", userId);
  const { developerId, date } = req.query;

  try {
    const workReport = await WorkReport.findOne({
      developerId: new mongoose.Types.ObjectId(developerId),
      workDate: date,
    })
      .populate({
        path: "reports.projectId",
        select: "projectName projectCode",
      })
      .populate({
        path: "reports.feedId",
        select: "feedName",
      });

    console.log("workReport", workReport);
    if (!workReport) {
      return res.status(404).json({
        success: false,
        message: "Work report not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: workReport,
      userId: userId,
    });
  } catch (error) {
    console.error("Work report error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch work reports",
    });
  }
};

const getworkreportDetails = async (req, res) => {
  const { id, fromDate, toDate, page = 1, limit = 10 } = req.query;
  const developerId = id;
  console.log("req.query", req.query);

  try {
    const query = {
      developerId: new mongoose.Types.ObjectId(developerId),
    };

    // ✅ Apply date filter only if both present
    if (fromDate && toDate) {
      query.workDate = { $gte: fromDate, $lte: toDate };
    }

    const skip = (page - 1) * limit;

    const data = await WorkReport.aggregate([
      { $match: query },

      { $unwind: "$reports" },

      // 🔹 Project lookup
      {
        $lookup: {
          from: "projects",
          localField: "reports.projectId",
          foreignField: "_id",
          as: "project",
        },
      },

      // 🔹 Feed lookup
      {
        $lookup: {
          from: "feeds",
          localField: "reports.feedId",
          foreignField: "_id",
          as: "feed",
        },
      },

      // 🔹 Keep ONLY names
      {
        $addFields: {
          "reports.projectName": {
            $ifNull: [{ $arrayElemAt: ["$project.name", 0] }, "-"],
          },
          "reports.feedName": {
            $ifNull: [{ $arrayElemAt: ["$feed.feedName", 0] }, "-"],
          },
        },
      },

      // 🔹 Remove unused fields
      {
        $project: {
          project: 0,
          feed: 0,
          "reports.projectId": 0,
          "reports.feedId": 0,
        },
      },

      // 🔹 Group back
      {
        $group: {
          _id: "$_id",
          developerId: { $first: "$developerId" },
          workDate: { $first: "$workDate" },
          totalTime: { $first: "$totalTime" },
          reports: { $push: "$reports" },
        },
      },

      { $sort: { workDate: -1 } },
      { $skip: Number(skip) },
      { $limit: Number(limit) },
    ]);

    const total = await WorkReport.countDocuments(query);

    res.status(200).json({
      success: true,
      data,
      total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch work reports",
    });
  }
};
const getuserslist = async (req, res) => {
  const Rolelevel = req.user.Rolelevel;
  const userId = new mongoose.Types.ObjectId(req.user.id);

  try {
    const pipeline = [
      {
        $lookup: {
          from: "roles",
          localField: "roleId",
          foreignField: "_id",
          as: "roleInfo",
        },
      },
      {
        $unwind: {
          path: "$roleInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    /* ---------- ROLE BASED VISIBILITY ---------- */

    // 🔹 Developer (6) → self + same TL developers
    if (Rolelevel === 6) {
      const me = await mongoose.connection.db
        .collection("users")
        .findOne({ _id: userId }, { projection: { reportingTo: 1 } });

      pipeline.push({
        $match: {
          $or: [{ _id: userId }, { reportingTo: me.reportingTo }],
        },
      });
    }

    // 🔹 Team Lead (5) → self + own developers
    if (Rolelevel === 5) {
      pipeline.push({
        $match: {
          $or: [{ _id: userId }, { reportingTo: userId }],
        },
      });
    }

    // 🔹 Manager (3) → all TLs + all developers under those TLs
    if (Rolelevel === 3) {
      // Step 1: get TL IDs
      const tls = await mongoose.connection.db
        .collection("users")
        .find({
          reportingTo: userId,
        })
        .project({ _id: 1 })
        .toArray();

      const tlIds = tls.map((tl) => tl._id);

      pipeline.push({
        $match: {
          $or: [
            { _id: { $in: tlIds } }, // TLs
            { reportingTo: { $in: tlIds } }, // Developers under TLs
          ],
        },
      });
    }

    /* ---------- FINAL PROJECTION ---------- */
    pipeline.push({
      $project: {
        _id: 1,
        name: 1,
      },
    });

    const users = await mongoose.connection.db
      .collection("users")
      .aggregate(pipeline)
      .toArray();

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
const getFeedsByProjectworkreport = async (req, res) => {
  try {
    const projectId = req.params.id;
    const permission = res.locals.permissions;

    const { Active } = req.query;
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "Project ID is required",
      });
    }
    const query = { projectId };

    // ✅ Apply active filter ONLY if provided
    if (Active !== undefined) {
      query.active = Active === "true"; // convert string → boolean
    }

    // Fetch feeds for the given projectId
    const feeds = await Feed.find(query)
      .select({ _id: 1, feedName: 1 })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: feeds,
      count: feeds.length,
      permission,
    });
  } catch (error) {
    console.error("Get feeds error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch feeds",
    });
  }
};
const getProjectlistworkreport = async (req, res) => {
  const rolelevel = req.user.Rolelevel;
  const userId = new mongoose.Types.ObjectId(req.user.id);
  const reportingTo = new mongoose.Types.ObjectId(req.user.reportingTo);
  console.log("teamLead", reportingTo, "userId", userId);
  const department = req.user.department;
  const { Active } = req.query;
  try {
    const matchStage = {};

    // ✅ Active filter
    if (Active !== undefined) {
      matchStage.isActive = Active === "true";
    }

    if (rolelevel === 4) {
      matchStage.department = department;
      matchStage.projectCoordinator = userId;
    }
    if (rolelevel === 5) {
      matchStage.department = department;
      matchStage.teamLead = { $in: [userId] };
    }
    if (rolelevel === 6) {
      matchStage.department = department;
      matchStage.teamLead = { $in: [reportingTo] };
    }

    // 🔹 Aggregation
    const projects = await Project.aggregate([
      { $match: matchStage },
      { $project: { _id: 1, projectName: 1, projectCode: 1 } },
    ]);
    console.log(" projects", projects);
    return res.status(200).json({
      success: true,
      data: projects,
      userDepartment: department,
    });
  } catch (error) {
    console.error("Get Project Error:", error);
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getworklistbydate = async (req, res) => {
  try {
    const { date, developerId } = req.query;

    // 🔒 Validate user
    if (!developerId || !mongoose.Types.ObjectId.isValid(developerId)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    // 🔒 Validate date
    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date is required",
      });
    }

    // Convert to ObjectId safely
    const devObjectId = new mongoose.Types.ObjectId(developerId);

    // ✅ Query (lean for performance)
    const workReports = await WorkReport.find({
      developerId: devObjectId,
      workDate: date,
    })
      .populate({
        path: "reports.feedId",
        select: "feedName",
      })
      .populate({
        path: "reports.projectId",
        select: "projectName projectCode",
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: workReports.length,
      data: workReports,
    });
  } catch (error) {
    console.error("getWorkListByDate error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch work reports",
    });
  }
};

module.exports = {
  AddWorkReport,
  GetWorkReports,
  getprojectworkreport,
  getProjectlistworkreport,
  getworkreportDetails,
  getuserslist,
  getFeedsByProjectworkreport,
  getworklistbydate,
  updateWorkReport,
};
