const Project = require("../models/ProjectModel");
const Feed = require("../models/FeedModel");
const User = require("../models/UserModel");
const ProjectActivity = require("../models/ProjectActivityLog");
const FeedActivity = require("../models/FeedActivityLog");
const WorkReport = require("../models/WorkReportModel");
const logProjectActivity = require("../utils/ProjectactivityLogger");
const logFeedActivity = require("../utils/FeedactivityLogger");
const sendMail = require("../utils/mailer");
const fs = require("fs");
const path = require("path");

const mongoose = require("mongoose");

const getProject = async (req, res) => {
  console.log("call this project api");

  const permission = res.locals.permissions;
  const department = req.user.department;
  const rolelevel = req.user.Rolelevel;
  const userId = new mongoose.Types.ObjectId(req.user.id); // req.user.id;
  const { Active } = req.query;

  try {
    let { page = 1, limit = 10, search = "" } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const matchStage = {};

    // 🔍 Search (projectName / projectCode)
    if (search && search.trim() !== "") {
      const keyword = search.trim();
      matchStage.$or = [
        { projectName: { $regex: keyword, $options: "i" } },
        { projectCode: { $regex: keyword, $options: "i" } },
      ];
    }

    // ✅ Active filter
    if (Active !== undefined) {
      matchStage.isActive = Active === "true";
    }
    if (rolelevel === 3 && department === "Development") {
      matchStage.department = department;
      matchStage.projectManager = userId;
      matchStage.projectTechManager = userId;
    }
    if (rolelevel === 3 && department === "Client Success") {
      matchStage.csprojectManager = userId;
    }
    if (rolelevel === 4) {
      // matchStage.department = department;
      matchStage.projectCoordinator = { $in: [userId] }; //userId};
    }
    if (rolelevel === 5) {
      matchStage.department = department;
      matchStage.teamLead = { $in: [userId] };
    }
    if (rolelevel === 6) {
      matchStage.department = department;
      matchStage.developers = { $in: [userId] };
    }
    if (rolelevel === 7 && department === "Sales") {
      matchStage.$or = [{ bde: userId }, { createdBy: userId }];
    }

    // 🔢 Total count
    const total = await Project.countDocuments(matchStage);

    // 🔹 Aggregation
    const projects = await Project.aggregate([
      { $match: matchStage },

      // Project Manager
      {
        $lookup: {
          from: "users",
          localField: "projectManager",
          foreignField: "_id",
          pipeline: [{ $project: { _id: 1, name: 1 } }],
          as: "projectManager",
        },
      },
      {
        $unwind: { path: "$projectManager", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "users",
          localField: "projectTechManager",
          foreignField: "_id",
          pipeline: [{ $project: { _id: 1, name: 1 } }],
          as: "projectTechManager",
        },
      },
      {
        $unwind: {
          path: "$projectTechManager",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "csprojectManager",
          foreignField: "_id",
          pipeline: [{ $project: { _id: 1, name: 1 } }],
          as: "csprojectManager",
        },
      },
      {
        $unwind: {
          path: "$csprojectManager",
          preserveNullAndEmptyArrays: true,
        },
      },

      // BDE (Sales Person)
      {
        $lookup: {
          from: "users",
          localField: "bde",
          foreignField: "_id",
          pipeline: [{ $project: { _id: 1, name: 1 } }],
          as: "bde",
        },
      },
      { $unwind: { path: "$bde", preserveNullAndEmptyArrays: true } },

      //Team leads
      {
        $lookup: {
          from: "users",
          localField: "teamLead",
          foreignField: "_id",
          pipeline: [{ $project: { _id: 1, name: 1 } }],
          as: "teamLead",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "developers",
          foreignField: "_id",
          pipeline: [{ $project: { _id: 1, name: 1 } }],
          as: "developers",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "projectCoordinator",
          foreignField: "_id",
          pipeline: [{ $project: { _id: 1, name: 1 } }],
          as: "projectCoordinator",
        },
      },
      {
        $unwind: {
          path: "$projectCoordinator",
          preserveNullAndEmptyArrays: true,
        },
      },

      // 🔢 Feed Count (optional, safe)
      {
        $lookup: {
          from: "feeds",
          localField: "_id",
          foreignField: "projectId",
          as: "feeds",
        },
      },
      { $addFields: { feedCount: { $size: "$feeds" } } },
      { $project: { feeds: 0 } },
      {
        $lookup: {
          from: "escalations", // ⚠️ MongoDB collection names are lowercase by default
          let: { projectId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$project", "$$projectId"] }, // project reference
                    { $eq: ["$status", "Open"] }, // only open escalations
                    // { $eq: ["$assignedTo", userId] }   // enable if user-based
                  ],
                },
              },
            },
            { $limit: 1 }, // 🚀 performance optimization
          ],
          as: "openEscalation",
        },
      },
      {
        $addFields: {
          hasEscalation: {
            $cond: [
              { $gt: [{ $size: "$openEscalation" }, 0] },
              true,
              "$$REMOVE", // ❌ do not send false
            ],
          },
        },
      },
      {
        $project: {
          openEscalation: 0, // 🧹 cleanup response
        },
      },

      // Sort & Pagination
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ]);

    return res.status(200).json({
      success: true,
      data: projects,
      total,
      permission,
      userDepartment: department,
    });
  } catch (error) {
    console.error("Get Project Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const getProjectbyId = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid project ID",
    });
  }

  try {
    const project = await Project.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id),
        },
      },

      /* ================= PROJECT MANAGER ================= */
      {
        $lookup: {
          from: "users",
          localField: "projectManager",
          foreignField: "_id",
          pipeline: [{ $project: { name: 1, email: 1, roleId: 1 } }],
          as: "projectManager",
        },
      },
      {
        $unwind: { path: "$projectManager", preserveNullAndEmptyArrays: true },
      },

      /* ================= TECH MANAGER ================= */
      {
        $lookup: {
          from: "users",
          localField: "projectTechManager",
          foreignField: "_id",
          pipeline: [{ $project: { name: 1, email: 1, roleId: 1 } }],
          as: "projectTechManager",
        },
      },
      {
        $unwind: {
          path: "$projectTechManager",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "csprojectManager",
          foreignField: "_id",
          pipeline: [{ $project: { name: 1, email: 1, roleId: 1 } }],
          as: "csprojectManager",
        },
      },
      {
        $unwind: {
          path: "$csprojectManager",
          preserveNullAndEmptyArrays: true,
        },
      },

      /* ================= TEAM LEADS ================= */
      {
        $lookup: {
          from: "users",
          localField: "teamLead",
          foreignField: "_id",
          pipeline: [{ $project: { name: 1, email: 1 } }],
          as: "teamLead",
        },
      },

      /* ================= DEVELOPERS ================= */
      {
        $lookup: {
          from: "users",
          localField: "developers",
          foreignField: "_id",
          pipeline: [{ $project: { name: 1, email: 1 } }],
          as: "developers",
        },
      },

      /* ================= PROJECT COORDINATOR ================= */
      {
        $lookup: {
          from: "users",
          localField: "projectCoordinator",
          foreignField: "_id",
          pipeline: [{ $project: { name: 1, email: 1 } }],
          as: "projectCoordinator",
        },
      },

      /* ================= BDE ================= */
      {
        $lookup: {
          from: "users",
          localField: "bde",
          foreignField: "_id",
          pipeline: [{ $project: { name: 1, email: 1 } }],
          as: "bde",
        },
      },
      { $unwind: { path: "$bde", preserveNullAndEmptyArrays: true } },

      /* ================= CREATED BY ================= */
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          pipeline: [{ $project: { name: 1, email: 1 } }],
          as: "createdBy",
        },
      },
      { $unwind: { path: "$createdBy", preserveNullAndEmptyArrays: true } },

      /* ================= FEED COUNT ================= */
      {
        $lookup: {
          from: "feeds",
          localField: "_id",
          foreignField: "projectId",
          as: "feeds",
        },
      },
      {
        $addFields: {
          feedCount: { $size: "$feeds" },
        },
      },
      { $project: { feeds: 0 } },
    ]);

    if (!project.length) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const projectActivities = await ProjectActivity.find({ projectId: id })
      .sort({ createdAt: -1 })
      .populate("ActionUserId", "name profileImage")
      .lean();
    const projectObjectId = new mongoose.Types.ObjectId(id);

    const developerEffort = await WorkReport.aggregate([
      // 1️⃣ Match project
      {
        $match: {
          "reports.projectId": projectObjectId,
        },
      },

      // 2️⃣ Unwind reports
      {
        $unwind: "$reports",
      },

      // 3️⃣ Match again
      {
        $match: {
          "reports.projectId": projectObjectId,
        },
      },

      // 4️⃣ Lookup developer
      {
        $lookup: {
          from: "users",
          localField: "developerId",
          foreignField: "_id",
          as: "developer",
        },
      },
      { $unwind: "$developer" },

      // 5️⃣ Convert HH:MM → minutes
      {
        $addFields: {
          timeInMinutes: {
            $add: [
              {
                $multiply: [
                  {
                    $toInt: {
                      $arrayElemAt: [
                        { $split: ["$reports.timeSpent", ":"] },
                        0,
                      ],
                    },
                  },
                  60,
                ],
              },
              {
                $toInt: {
                  $arrayElemAt: [{ $split: ["$reports.timeSpent", ":"] }, 1],
                },
              },
            ],
          },
        },
      },

      // 6️⃣ Group by developer
      {
        $group: {
          _id: "$developer._id",
          developerName: { $first: "$developer.name" },
          totalMinutes: { $sum: "$timeInMinutes" },
        },
      },

      // 7️⃣ Convert minutes → HH:MM
      {
        $project: {
          _id: 0,
          developerName: 1,
          totalTime: {
            $concat: [
              {
                $toString: {
                  $floor: { $divide: ["$totalMinutes", 60] },
                },
              },
              ":",
              {
                $cond: [
                  { $lt: [{ $mod: ["$totalMinutes", 60] }, 10] },
                  {
                    $concat: [
                      "0",
                      { $toString: { $mod: ["$totalMinutes", 60] } },
                    ],
                  },
                  { $toString: { $mod: ["$totalMinutes", 60] } },
                ],
              },
            ],
          },
        },
      },

      // 8️⃣ Sort by total time (optional)
      {
        $sort: { developerName: 1 },
      },
    ]);

    console.log("workreport data", developerEffort);

    return res.status(200).json({
      success: true,
      data: project[0],
      projectActivities,
      workReports: developerEffort,
    });
  } catch (error) {
    console.error("Get Project By ID Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const ProjectIntegration = async (req, res) => {
  console.log("call this ProjectIntegration api");
  const data = req.body;
  console.log("data", data);
  const files = req.files;
  console.log("files", files);
  const userId = req.user.id;

  try {
    const {
      projectName,
      projectCode,
      description,
      deliveryType,
      deliveryMode,
      IndustryType,
      department,

      // projectPriority,
      // projectFrequencyConfig,
      projectManager,
      projectTechManager,
      csprojectManager,
      salesPerson,
    } = req.body;

    // 🔹 2. Validate required fields
    if (
      !projectName ||
      !deliveryType ||
      !department ||
      !projectManager ||
      !salesPerson ||
      !IndustryType ||
      !csprojectManager ||
      // !projectFrequencyConfig ||
      // !projectPriority ||
      !projectTechManager
    ) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
      });
    }
    // let parsedProjectFrequency;

    // try {
    //   parsedProjectFrequency =
    //     typeof projectFrequencyConfig === "string"
    //       ? JSON.parse(projectFrequencyConfig)
    // : projectFrequencyConfig;
    // } catch (error) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Invalid projectFrequencyConfig JSON format",
    //   });
    // }
    // 🔹 3. Handle files safely
    const sowFiles = req.files?.sowDocument || [];
    const inputFiles = req.files?.inputDocument || [];
    const annotationFiles = req.files?.annotationDocument || [];

    // Store file paths as array (recommended)
    const sowDocumentPaths = sowFiles.map(
      (file) => `uploads/sowdocument/${file.filename}`,
    );

    const inputDocumentPaths = inputFiles.map(
      (file) => `uploads/inputdocument/${file.filename}`,
    );

    const annotationDocumentPaths = annotationFiles.map(
      (file) => `uploads/annotationDocument/${file.filename}`,
    );

    const projectcodecheck = await Project.findOne({
      projectCode: projectCode,
    });
    if (projectcodecheck) {
      return res.status(400).json({
        success: false,
        message: "Project code already exists",
      });
    }

    // 🔹 5. Create Project
    const project = await Project.create({
      projectName,
      projectCode,
      description,
      deliveryType,
      deliveryMode,
      industryType: IndustryType,
      department,
      // projectPriority,
      // projectFrequency: parsedProjectFrequency,
      sowDocument: sowDocumentPaths,
      inputDocument: inputDocumentPaths,
      annotationDocument: annotationDocumentPaths,
      projectTechManager,
      projectManager,
      csprojectManager,
      bde: salesPerson,
      status: "New",
      isActive: true,
      createdBy: userId,
    });
    await logProjectActivity({
      userid: userId,
      username: req.user.name,
      projectId: project._id,
      actionTitle: "Project Created",
    });
    const users = await User.find({
      _id: {
        $in: [
          projectManager,
          projectTechManager,
          csprojectManager,
          salesPerson,
          userId,
        ],
      },
    }).select("email name role");
    const toEmails = users.map((u) => u.email);
    const ccEmails = ["vivekpankhaniyaactowiz@gmail.com"];

    const projectEmailHtml = `
<div style="font-family: 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f0f4f8; padding: 40px 10px; color: #1a202c;">
  <div style="max-width: 650px; margin: auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">

    <!-- Top Gradient -->
    <div style="height: 6px; background: linear-gradient(90deg, #3d01b2, #7c3aed);"></div>

    <!-- Header -->
    <div style="padding: 36px 30px 20px; text-align: center;">
      <h1 style="margin: 0; font-size: 26px; color: #1e1b4b;">
        📁 New Project Created
      </h1>
      <p style="color: #64748b; font-size: 16px; margin-top: 6px;">
        ACT-Nexus Project Management System
      </p>
    </div>

    <!-- Body -->
    <div style="padding: 0 40px 40px;">
      <p style="font-size: 16px;">
        Hello Team,
      </p>

      <p style="font-size: 15px; color: #475569; line-height: 1.6;">
        A new project has been successfully created in the <strong>ACT-Nexus Dashboard</strong>.
        You have been assigned to this project based on your role.
      </p>

      <!-- Project Details -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 22px; margin: 26px 0;">
        <h3 style="margin-top: 0; color: #1e1b4b;">📌 Project Details</h3>

        <table style="width: 100%; font-size: 14px; color: #334155;">
          <tr>
            <td style="padding: 6px 0;"><strong>Project Name:</strong></td>
            <td>${projectName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0;"><strong>Project Code:</strong></td>
            <td>${projectCode}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0;"><strong>Department:</strong></td>
            <td>${department}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0;"><strong>Industry:</strong></td>
            <td>${IndustryType}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0;"><strong>Delivery Type:</strong></td>
            <td>${deliveryType}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0;"><strong>Status:</strong></td>
            <td><span style="color:#16a34a; font-weight:600;">New</span></td>
          </tr>
        </table>
      </div>

      <!-- CTA -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="http://172.28.161.32:3005/ACT-Nexus/"
           target="_blank"
           style="background-color: #3d01b2; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px;">
          View Project in Dashboard
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 22px; text-align: center;">
      <p style="margin: 0; font-size: 13px; color: #94a3b8;">
        © ${new Date().getFullYear()} Actowiz Solutions • ACT-Nexus
      </p>
    </div>

  </div>
</div>
`;
    sendMail({
      to: toEmails, // Project Manager, Tech Manager, CS, BDE
      cc: ccEmails, // Creator
      subject: `New Project Created: ${projectName} (${projectCode})`,
      html: projectEmailHtml,
    });

    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: project,
    });
  } catch (error) {
    console.error("Create Project Error:", error);
    console.log("Create Project Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create project",
      error: error.message,
    });
  }
};

const projectUpdated = async (req, res) => {
  try {
    const { id } = req.params;

    let updateOps = {};
    let setOps = { ...req.body };

    // 🔹 Parse JSON config
    if (setOps.projectFrequencyConfig) {
      setOps.projectFrequency = JSON.parse(setOps.projectFrequencyConfig);
      delete setOps.projectFrequencyConfig;
    }

    // 🔹 Clean empty values
    Object.keys(setOps).forEach((key) => {
      if (
        setOps[key] === undefined ||
        setOps[key] === null ||
        setOps[key] === ""
      ) {
        delete setOps[key];
      }
    });

    if (req.files?.sowDocument?.length) {
      updateOps.$push = {
        ...(updateOps.$push || {}),
        sowDocument: {
          $each: req.files.sowDocument.map((f) => f.filename),
        },
      };
    }

    if (req.files?.annotationDocument?.length) {
      updateOps.$push = {
        ...(updateOps.$push || {}),
        annotationDocument: {
          $each: req.files.annotationDocument.map((f) => f.filename),
        },
      };
    }

    if (req.files?.inputDocument?.length) {
      updateOps.$push = {
        ...(updateOps.$push || {}),
        inputDocument: {
          $each: req.files.inputDocument.map((f) => f.filename),
        },
      };
    }

    if (Object.keys(setOps).length) {
      updateOps.$set = setOps;
    }
    const updatedFields = [];

    if (updateOps.$set) {
      updatedFields.push(...Object.keys(updateOps.$set));
    }

    if (updateOps.$push) {
      updatedFields.push(...Object.keys(updateOps.$push));
    }

    const projection = {};
    updatedFields.forEach((key) => (projection[key] = 1));

    const oldProject = await Project.findById(id, projection).lean();
    console.log("oldProject", oldProject);

    const updatedProject = await Project.findByIdAndUpdate(id, updateOps, {
      new: true,
      runValidators: true,
    });
    const newData = updateOps.$set;

    await logProjectActivity({
      userid: req.user.id,
      username: req.user.name,
      projectId: id,
      actionTitle: "Project have been  Updated ",
      newData,
      oldData: oldProject,
    });
    if (!updatedProject) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: updatedProject,
    });
  } catch (error) {
    console.error("Update Project Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update project",
      error: error.message,
    });
  }
};

const getFeedsByProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const permission = res.locals.permissions;
    const rolelevel = req.user.Rolelevel;

    let { page = 1, limit = 10, search = "" } = req.query;
    console.log(req.query);
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "Project ID is required",
      });
    }

    /** -------------------------
     * Base Filter
     * ------------------------- */
    const query = { projectId };

    // ✅ Role-based filter (Developer only sees assigned feeds)
    if (rolelevel === 6) {
      query.developers = { $in: [req.user.id] };
    }

    // ✅ Search filter
    if (search) {
      query.$or = [
        { feedName: { $regex: search, $options: "i" } },
        { feedCode: { $regex: search, $options: "i" } },
      ];
    }

    /** -------------------------
     * Fetch Feeds + Count
     * ------------------------- */
    const [feeds, totalRecords] = await Promise.all([
      Feed.find(query)
        .populate("developers", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Feed.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: feeds,
      pagination: {
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
        currentPage: page,
        limit,
      },
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

const Projectstatusupdate = async (req, res) => {
  const { id } = req.params;
  const { active } = req.body;
  const userId = req.user.id;
  console.log("id", id, "active", active);

  try {
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    project.isActive = active;
    await project.save();
    await logProjectActivity({
      userid: userId,
      username: req.user.name,
      projectId: project._id,
      newData: active,
      oldData: !active,
      actionTitle: "Project Active Status Updated",
    });
    res.status(200).json({ message: "Project status updated successfully" });
  } catch (error) {
    console.error("Error updating project status:", error);
    res.status(500).json({ message: "Failed to update project status" });
  }
};

const getassignusers = async (req, res) => {
  const rolelevel = req.user.Rolelevel;
  const { department, reportingId, coordinator, teamLead } = req.query;

  try {
    const tlRole = await mongoose.connection.db
      .collection("roles")
      .findOne({ Rolelevel: 5 }, { projection: { _id: 1 } });
    const pcRole = await mongoose.connection.db
      .collection("roles")
      .findOne({ Rolelevel: 4 }, { projection: { _id: 1 } });
    if (!tlRole) {
      return res.status(404).json({ message: "TL role not found" });
    }
    let filter = {};

    if (teamLead) {
      filter = {
        roleId: tlRole._id,
        department: department,
        reportingTo: new mongoose.Types.ObjectId(reportingId),
        status: true,
      };
    }
    if (coordinator) {
      filter = {
        roleId: pcRole._id,
        department: department,
        reportingTo: new mongoose.Types.ObjectId(reportingId),
        status: true,
      };
    }
    console.log("filter", filter);
    // 4️⃣ Fetch users
    const data = await User.find(filter).select("_id name ").sort({ name: 1 });
    console.log("data", data);
    return res.status(200).json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error("getTeamLeads error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch Team Leads",
    });
  }
};
const assignteam = async (req, res) => {
  try {
    const { teamlead, coordinator } = req.query;
    const { projectId, teamLeadIds = [], projectCoordinatorId = [] } = req.body;

    // ---------------- VALIDATION ----------------
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "Project ID is required",
      });
    }

    if (teamlead === "true") {
      if (teamLeadIds.length === 0 || teamLeadIds.length > 3) {
        return res.status(400).json({
          success: false,
          message: "Minimum 1 and maximum 3 Team Leads allowed",
        });
      }
    }

    if (coordinator === "true") {
      if (projectCoordinatorId.length > 2) {
        return res.status(400).json({
          success: false,
          message: "Maximum 2 Project Coordinators allowed",
        });
      }
    }

    const projId = new mongoose.Types.ObjectId(projectId);

    const updateQuery = {
      $addToSet: {},
    };

    // ---------------- CONDITIONAL ASSIGNMENT ----------------
    if (teamlead === "true") {
      updateQuery.$addToSet.teamLead = {
        $each: teamLeadIds.map((id) => new mongoose.Types.ObjectId(id)),
      };
      updateQuery.$set = { status: "Under Development" };
    }

    if (coordinator === "true") {
      updateQuery.$addToSet.projectCoordinator = {
        $each: projectCoordinatorId.map(
          (id) => new mongoose.Types.ObjectId(id),
        ),
      };
    }

    // ---------------- UPDATE PROJECT ----------------
    const updatedProject = await Project.findByIdAndUpdate(
      projId,
      updateQuery,
      { new: true },
    )
      .populate("teamLead", "name email reportingTo")
      .populate("projectCoordinator", "name email reportingTo");

    if (!updatedProject) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // ---------------- ACTIVITY LOG ----------------
    let activityTitle = "";
    let newData = {};

    if (teamlead === "true" && coordinator === "true") {
      activityTitle = "Team Leads & Project Coordinators Assigned";
      newData = {
        teamLead: updatedProject.teamLead.map((tl) => tl.name),
        projectCoordinator: updatedProject.projectCoordinator.map(
          (pc) => pc.name,
        ),
      };
    } else if (teamlead === "true") {
      activityTitle = "Team Leads Assigned";
      newData = {
        teamLead: updatedProject.teamLead.map((tl) => tl.name),
      };
    } else if (coordinator === "true") {
      activityTitle = "Project Coordinators Assigned";
      newData = {
        projectCoordinator: updatedProject.projectCoordinator.map(
          (pc) => pc.name,
        ),
      };
    }

    if (activityTitle) {
      await logProjectActivity({
        userid: req.user.id,
        username: req.user.name,
        projectId: updatedProject._id,
        newData,
        actionTitle: activityTitle,
      });
    }

    // ---------------- STATUS ACTIVITY ----------------
    await logProjectActivity({
      userid: req.user.id,
      username: req.user.name,
      projectId: updatedProject._id,
      oldData: "New",
      newData: updatedProject.status,
      actionTitle: "Project Status Updated",
    });

    if (teamlead === "true" && updatedProject.teamLead?.length) {
      const teamLeadEmails = updatedProject.teamLead
        .map((tl) => tl.email)
        .filter(Boolean);
      const reportingTo = updatedProject.teamLead.map((tl) => tl.reportingTo);
      const reportingPerson = await User.find({ _id: { $in: reportingTo } })
        .select("email")
        .lean();
      const reportingPersonEmail = reportingPerson.map((rp) => rp.email);
      if (teamLeadEmails.length) {
        const teamLeadEmailHtml = `
    <div style="font-family: Inter, Arial; background:#f0f4f8; padding:30px;">
      <div style="max-width:600px; margin:auto; background:#fff; border-radius:14px; overflow:hidden;">
        <div style="background:#3d01b2; padding:18px; color:#fff; text-align:center;">
          <h2>👨‍💼 Team Lead Assignment</h2>
        </div>

        <div style="padding:28px;">
          <p>Hello Team,</p>

          <p>
            You have been assigned as <strong>Team Lead</strong> for the following project:
          </p>

          <table style="width:100%; margin-top:15px; font-size:14px;">
            <tr><td><strong>Project:</strong></td><td>${
              updatedProject.projectName
            }</td></tr>
            <tr><td><strong>Project Code:</strong></td><td>${
              updatedProject.projectCode
            }</td></tr>
            <tr><td><strong>Status:</strong></td><td>${
              updatedProject.status
            }</td></tr>
          </table>

          <p style="margin-top:20px;">
            Please coordinate with the reporting manager and start execution.
          </p>

          <div style="text-align:center; margin-top:25px;">
            <a href="http://172.28.161.32:3005/ACT-Nexus/"
               style="background:#3d01b2; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none;">
              Open Dashboard
            </a>
          </div>
        </div>

        <div style="background:#f8fafc; padding:15px; text-align:center; font-size:12px;">
          © ${new Date().getFullYear()} Actowiz Solutions
        </div>
      </div>
    </div>
    `;

        await sendMail({
          to: teamLeadEmails,
          cc: reportingPersonEmail ? [reportingPersonEmail] : [],
          subject: `Team Lead Assigned – ${updatedProject.projectName}`,
          html: teamLeadEmailHtml,
        });
      }
    }
    if (coordinator === "true" && updatedProject.projectCoordinator?.length) {
      const coordinatorEmails = updatedProject.projectCoordinator
        .map((pc) => pc.email)
        .filter(Boolean);
      const reportingTo = updatedProject.projectCoordinator.map(
        (pc) => pc.reportingTo,
      );
      const reportingPerson = await User.find({ _id: { $in: reportingTo } })
        .select("email")
        .lean();
      const reportingPersonEmail = reportingPerson.map((rp) => rp.email);

      if (coordinatorEmails.length) {
        const coordinatorEmailHtml = `
    <div style="font-family: Inter, Arial; background:#f0f4f8; padding:30px;">
      <div style="max-width:600px; margin:auto; background:#fff; border-radius:14px;">
        <div style="background:#0f766e; padding:18px; color:#fff; text-align:center;">
          <h2>📋 Project Coordinator Assignment</h2>
        </div>

        <div style="padding:28px;">
          <p>Hello,</p>

          <p>
            You have been assigned as a <strong>Project Coordinator</strong> for the project below:
          </p>

          <table style="width:100%; margin-top:15px; font-size:14px;">
            <tr><td><strong>Project:</strong></td><td>${
              updatedProject.projectName
            }</td></tr>
            <tr><td><strong>Project Code:</strong></td><td>${
              updatedProject.projectCode
            }</td></tr>
            <tr><td><strong>Department:</strong></td><td>${
              updatedProject.department
            }</td></tr>
          </table>

          <p style="margin-top:20px;">
            Please coordinate with the Team Leads and reporting manager.
          </p>

          <div style="text-align:center; margin-top:25px;">
            <a href="http://172.28.161.32:3005/ACT-Nexus/"
               style="background:#0f766e; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none;">
              Open Dashboard
            </a>
          </div>
        </div>

        <div style="background:#f8fafc; padding:15px; text-align:center; font-size:12px;">
          © ${new Date().getFullYear()} Actowiz Solutions
        </div>
      </div>
    </div>
    `;

        await sendMail({
          to: coordinatorEmails,
          cc: reportingPersonEmail
            ? [reportingPersonEmail]
            : ["vivekpankhaniyaactowiz@gmail.com"],
          subject: `Project Coordinator Assigned – ${updatedProject.projectName}`,
          html: coordinatorEmailHtml,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: activityTitle || "Project updated successfully",
      data: updatedProject,
    });
  } catch (error) {
    console.error("assign project TL/PC error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to assign team",
    });
  }
};
// const createFeed = async (req, res) => {
//   const {
//     projectId,
//     platformName,
//     feedPriority,
//     scopeType,
//     platformType,
//     frequencyType,
//     countries,
//     description,
//     frequencyConfig,
//   } = req.body;

//   let parsedProjectFrequency;

//   try {
//     parsedProjectFrequency =
//       typeof frequencyConfig === "string"
//         ? JSON.parse(frequencyConfig)
//         : frequencyConfig;
//   } catch (error) {
//     return res.status(400).json({
//       success: false,
//       message: "Invalid projectFrequencyConfig JSON format",
//     });
//   }
//   const capFirst = (text = "") => text.charAt(0).toUpperCase() + text.slice(1);

//   const FeedName = `${capFirst(platformName)}|${countries
//     .map((country) => country.code)
//     .join(",")}|${platformType}|${scopeType}|${frequencyType}`;
//   console.log("req.body", req.body, FeedName);

//   const existingFeed = await Feed.findOne({ feedName: FeedName });
//   if (existingFeed) {
//     return res.status(400).json({
//       success: false,
//       message: "Feed with the same name already exists",
//     });
//   }
//   const generateFeedCode = () =>
//     String(Math.floor(Math.random() * 10000)).padStart(4, "0");

//   let feedCode;
//   let exists = true;

//   while (exists) {
//     feedCode = generateFeedCode();
//     exists = await Feed.exists({ feedCode });
//   }

//   const feed = await Feed.create({
//     projectId: projectId,
//     feedName: FeedName,
//     feedCode,
//     feedPriority,
//     platformName,
//     platformType,
//     scopeType,
//     feedfrequency: parsedProjectFrequency,
//     countries,
//     description,
//     status: "New",
//     createdBy: req.user.id,
//   });
//   const project = await Project.findById(projectId);
//   project.feedIds.push(feed._id);
//   await project.save();

//   await logFeedActivity({
//     userid: req.user.id,
//     username: req.user.name,
//     projectId: projectId,
//     feedId: feed._id,
//     actionTitle: "Feed created",
//   });
//   newData = {
//     feedId: feed._id,
//     FeedName: feed.feedName,
//   };
//   await logProjectActivity({
//     userid: req.user.id,
//     username: req.user.name,
//     projectId: projectId,
//     actionTitle: "Feed created",
//     newData: newData,
//   });

//   try {
//     const projectDetails = await Project.findById(projectId)
//       .populate("projectManager", "email name")
//       .populate("csprojectManager", "email name")
//       .populate("projectTechManager", "email name")
//       .populate("createdBy", "email name")
//       .populate("bde", "email name")
//       .populate("teamLead", "email name")
//       .populate("projectCoordinator", "email name");

//     const currentUser = await User.findById(req.user.id).populate(
//       "reportingTo",
//       "email name"
//     );

//     const toEmail = currentUser.email;
//     const ccEmails = new Set();

//     if (currentUser.reportingTo?.email) {
//       ccEmails.add(currentUser.reportingTo.email);
//     }
//     if (projectDetails.projectManager?.email) {
//       ccEmails.add(projectDetails.projectManager.email);
//     }
//     if (projectDetails.bde?.email) {
//       ccEmails.add(projectDetails.bde.email);
//     }
//     if (projectDetails.createdBy?.email) {
//       ccEmails.add(projectDetails.createdBy.email);
//     }
//     if (projectDetails.projectCoordinator?.email) {
//       ccEmails.add(projectDetails.projectCoordinator.email);
//     }
//     if (projectDetails.projectTechManager?.email) {
//       ccEmails.add(projectDetails.projectTechManager.email);
//     }
//     if (projectDetails.csprojectManager?.email) {
//       ccEmails.add(projectDetails.csprojectManager.email);
//     }
//     if (projectDetails.teamLead?.email) {
//       ccEmails.add(projectDetails.teamLead.email);
//     }
//     // Remove self from CC
//     ccEmails.delete(toEmail);
//     const ccList = Array.from(ccEmails).filter(Boolean);

//     const emailHtml = `
//       <div style="font-family: 'Inter', sans-serif; background-color: #f4f6f8; padding: 40px 10px; color: #1e293b;">
//         <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">

//           <!-- Header -->
//           <div style="background: linear-gradient(135deg, #4f46e5 0%, #3d01b2 100%); padding: 30px 20px; text-align: center;">
//              <h1 style="margin: 0; font-size: 24px; color: #ffffff; letter-spacing: 0.5px;">New Feed Created</h1>
//              <p style="margin: 5px 0 0; color: #e0e7ff; font-size: 14px;">ACT-Nexus Notification</p>
//           </div>

//           <!-- Body -->
//           <div style="padding: 30px;">
//             <p style="font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 24px;">
//               Hello <strong>${currentUser.name}</strong>,
//             </p>
//             <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 30px;">
//               A new feed has been successfully created under project <strong>${
//                 projectDetails.projectName
//               }</strong>.
//             </p>

//             <!-- Feed Details Card -->
//             <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
//                <table style="width: 100%; border-collapse: collapse;">
//                  <tr>
//                    <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600; width: 120px;">FEED NAME</td>
//                    <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 500;">${
//                      feed.feedName
//                    }</td>
//                  </tr>
//                  <tr>
//                    <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600;">FEED CODE</td>
//                    <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 500;">${
//                      feed.feedCode
//                    }</td>
//                  </tr>
//                  <tr>
//                     <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600;">PLATFORM</td>
//                     <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 500;">${
//                       feed.platformName
//                     } (${feed.platformType})</td>
//                  </tr>
//                  <tr>
//                     <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600;">FREQUENCY</td>
//                     <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 500;">${
//                       feed.feedfrequency?.frequencyType || "-"
//                     }</td>
//                  </tr>
//                  <tr>
//                     <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600;">STATUS</td>
//                     <td style="padding: 8px 0; color: #15803d; font-size: 14px; font-weight: 600;">${
//                       feed.status
//                     }</td>
//                  </tr>
//                </table>
//             </div>

//             <div style="margin-top: 40px; text-align: center;">
//               <a href="http://172.28.161.32:3005/ACT-Nexus/" style="background-color: #4f46e5; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">View Feed</a>
//             </div>
//           </div>

//           <!-- Footer -->
//           <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
//              <p style="margin: 0; font-size: 12px; color: #94a3b8;">© ${new Date().getFullYear()} Actowiz Solutions. All rights reserved.</p>
//           </div>
//         </div>
//       </div>
//     `;
//     console.log("toEmail", toEmail);
//     console.log("ccList", ccList);
//     await sendMail({
//       to: toEmail,
//       cc: ccList,
//       subject: `New Feed Created: ${feed.feedName}`,
//       html: emailHtml,
//     });
//   } catch (emailError) {
//     console.error("Failed to send feed creation email:", emailError);
//   }

//   res.status(201).json({
//     success: true,
//     message: "Feed created successfully",
//     data: feed,
//   });
// };
const createFeed = async (req, res) => {
  try {
    const {
      projectId,
      platformName,
      feedPriority,
      scopeType,
      platformType,
      frequencyType,
      countries = [],
      description,
      frequencyConfig,
    } = req.body;

    /* ---------------- VALIDATION ---------------- */
    if (!projectId || !platformName || !countries.length) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
      });
    }

    /* ---------------- PARSE FREQUENCY ---------------- */
    let parsedFrequency;
    try {
      parsedFrequency =
        typeof frequencyConfig === "string"
          ? JSON.parse(frequencyConfig)
          : frequencyConfig;
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid frequencyConfig JSON",
      });
    }

    /* ---------------- FEED NAME ---------------- */
    const capFirst = (t = "") => t.charAt(0).toUpperCase() + t.slice(1);

    const feedName = `${capFirst(platformName)}|${countries
      .map((c) => c.code)
      .join(",")}|${platformType}|${scopeType}|${frequencyType}`;

    const existingFeed = await Feed.findOne({ feedName });
    if (existingFeed) {
      return res.status(400).json({
        success: false,
        message: "Feed with the same name already exists",
      });
    }

    /* ---------------- FEED CODE ---------------- */
    let feedCode;
    do {
      feedCode = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
    } while (await Feed.exists({ feedCode }));

    /* ---------------- CREATE FEED ---------------- */
    const feed = await Feed.create({
      projectId,
      feedName,
      feedCode,
      feedPriority,
      platformName,
      platformType,
      scopeType,
      feedfrequency: parsedFrequency,
      countries,
      description,
      status: "New",
      createdBy: req.user.id,
    });

    /* ---------------- UPDATE PROJECT ---------------- */
    await Project.findByIdAndUpdate(projectId, {
      $addToSet: { feedIds: feed._id },
    });

    /* ---------------- ACTIVITY LOGS ---------------- */
    await logFeedActivity({
      userid: req.user.id,
      username: req.user.name,
      projectId,
      feedId: feed._id,
      actionTitle: "Feed created",
    });

    await logProjectActivity({
      userid: req.user.id,
      username: req.user.name,
      projectId,
      actionTitle: "Feed created",
      newData: { feedId: feed._id, feedName },
    });

    try {
      const project = await Project.findById(projectId)
        .populate("projectManager", "email")
        .populate("csprojectManager", "email")
        .populate("projectTechManager", "email")
        .populate("createdBy", "email")
        .populate("bde", "email")
        .populate("teamLead", "email")
        .populate("projectCoordinator", "email");

      const currentUser = await User.findById(req.user.id)
        .populate("reportingTo", "email name")
        .lean();

      const toEmail = currentUser.email;
      const ccSet = new Set();

      const addEmail = (email) => email && ccSet.add(email);

      addEmail(currentUser.reportingTo?.email);
      addEmail(project.projectManager?.email);
      addEmail(project.csprojectManager?.email);
      addEmail(project.projectTechManager?.email);
      addEmail(project.createdBy?.email);
      addEmail(project.bde?.email);

      project.teamLead?.forEach((tl) => addEmail(tl.email));
      project.projectCoordinator?.forEach((pc) => addEmail(pc.email));

      ccSet.delete(toEmail);

      const emailHtml = `
            <div style="font-family: 'Inter', sans-serif; background-color: #f4f6f8; padding: 40px 10px; color: #1e293b;">
              <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">

                <!-- Header -->
                <div style="background: linear-gradient(135deg, #4f46e5 0%, #3d01b2 100%); padding: 30px 20px; text-align: center;">
                   <h1 style="margin: 0; font-size: 24px; color: #ffffff; letter-spacing: 0.5px;">New Feed Created</h1>
                   <p style="margin: 5px 0 0; color: #e0e7ff; font-size: 14px;">ACT-Nexus Notification</p>
                </div>

                <!-- Body -->
                <div style="padding: 30px;">
                  <p style="font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 24px;">
                    Hello <strong>${currentUser.name}</strong>,
                  </p>
                  <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 30px;">
                    A new feed has been successfully created under project <strong>${
                      project.projectCode + " - " + project.projectName
                    }</strong>.
                  </p>

                  <!-- Feed Details Card -->
                  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
                     <table style="width: 100%; border-collapse: collapse;">
                       <tr>
                         <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600; width: 120px;">FEED NAME</td>
                         <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 500;">${
                           feed.feedName
                         }</td>
                       </tr>
                       <tr>
                         <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600;">FEED CODE</td>
                         <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 500;">${
                           feed.feedCode
                         }</td>
                       </tr>
                       <tr>
                          <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600;">PLATFORM</td>
                          <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 500;">${
                            feed.platformName
                          } (${feed.platformType})</td>
                       </tr>
                       <tr>
                          <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600;">FREQUENCY</td>
                          <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 500;">${
                            feed.feedfrequency?.frequencyType || "-"
                          }</td>
                       </tr>
                       <tr>
                          <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600;">STATUS</td>
                          <td style="padding: 8px 0; color: #15803d; font-size: 14px; font-weight: 600;">${
                            feed.status
                          }</td>
                       </tr>
                     </table>
                  </div>

                  <div style="margin-top: 40px; text-align: center;">
                    <a href="http://172.28.161.32:3005/ACT-Nexus/" style="background-color: #4f46e5; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">View Feed</a>
                  </div>
                </div>

                <!-- Footer -->
                <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                   <p style="margin: 0; font-size: 12px; color: #94a3b8;">© ${new Date().getFullYear()} Actowiz Solutions. All rights reserved.</p>
                </div>
              </div>
            </div>
          `;
      console.log("emailHtml", emailHtml);
      console.log("toEmail", toEmail);
      console.log("ccSet", ccSet);
      await sendMail({
        to: [toEmail],
        cc: [...ccSet],
        subject: `New Feed Created – ${feed.feedName}`,
        html: emailHtml,
      });
    } catch (emailErr) {
      console.error("Feed email error:", emailErr);
      console.log("emailErr", emailErr);
    }

    return res.status(201).json({
      success: true,
      message: "Feed created successfully",
      data: feed,
    });
  } catch (error) {
    console.error("createFeed error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create feed",
    });
  }
};
const feedActivestatusupdate = async (req, res) => {
  console.log("this this is calll");
  const { id } = req.params;

  console.log("id", id);
  const feedId = new mongoose.Types.ObjectId(id);
  const { active } = req.body;
  const userId = req.user.id;

  try {
    const feed = await Feed.findById(id);
    if (!feed) {
      return res.status(404).json({ message: "Feed not found" });
    }
    await Feed.updateOne({ _id: feedId }, { $set: { active } });
    await logFeedActivity({
      userid: userId,
      username: req.user.name,
      feedId: feedId,
      projectId: feed.projectId,
      newData: active,
      oldData: !active,
      actionTitle: "Feed Active Status Updated",
    });
    res.status(200).json({ message: "Feed status updated successfully" });
  } catch (error) {
    console.error("Error updating feed status:", error);
    console.log(error);
    res.status(500).json({ message: "Failed to update feed status" });
  }
};
const getdevelopers = async (req, res) => {
  const rolelevel = req.user.Rolelevel;
  const department = req.user.department;
  const userId = new mongoose.Types.ObjectId(req.user.id);
  const { ProjectId } = req.query;
  try {
    if (!ProjectId) {
      return res.status(400).json({ message: "ProjectId is required" });
    }

    const projectId = new mongoose.Types.ObjectId(ProjectId);

    const devRole = await mongoose.connection.db
      .collection("roles")
      .findOne({ Rolelevel: 6 }, { projection: { _id: 1 } });

    const getProjectTl = await Project.findOne({ _id: projectId }).select(
      "teamLead",
    );
    const reportingIds = getProjectTl.teamLead;

    const filter = {
      roleId: devRole._id,
      reportingTo: { $in: reportingIds },
      status: true,
    };
    if (rolelevel === 5) {
      filter.reportingTo = userId;
    }

    const developers = await User.find(filter)
      .select("_id name ")
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      data: developers,
    });
  } catch (error) {
    console.error("getdevelopers error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch Team Leads",
    });
  }
};

const assigndevelopers = async (req, res) => {
  try {
    const { developerIds, projectId, feedId } = req.body;
    const status = "Under Development";

    if (!developerIds || !developerIds.length || !feedId || !projectId) {
      return res.status(400).json({
        success: false,
        message: "developerIds, feedId and projectId are required",
      });
    }

    // 🔹 Convert IDs to ObjectId
    const feedObjectId = new mongoose.Types.ObjectId(feedId);
    const projectObjectId = new mongoose.Types.ObjectId(projectId);
    const developerObjectIds = developerIds.map(
      (id) => new mongoose.Types.ObjectId(id),
    );

    /* ---------------- UPDATE FEED ---------------- */
    const updatedFeed = await Feed.findByIdAndUpdate(
      feedObjectId,
      {
        $addToSet: {
          developers: { $each: developerObjectIds },
        },
        $set: {
          status: status,
        },
      },
      { new: true },
    );

    if (!updatedFeed) {
      return res.status(404).json({
        success: false,
        message: "Feed not found",
      });
    }

    /* ---------------- UPDATE PROJECT ---------------- */
    await Project.findByIdAndUpdate(
      projectObjectId,
      {
        $addToSet: {
          developers: { $each: developerObjectIds }, // ✅ same developers
        },
      },
      { new: true },
    );

    const NewData = {
      developers: updatedFeed.developers || [],
    };
    await logFeedActivity({
      userid: req.user.id,
      username: req.user.name,
      feedId: feedId,
      projectId: projectId,
      newData: NewData,
      actionTitle: "Developer(s) have been assigned",
    });

    await logFeedActivity({
      userid: req.user.id,
      feedId: feedId,
      username: req.user.name,
      projectId: projectId,
      newData: "In-Progress",
      oldData: "Pending",
      actionTitle: "Feed Status Updated",
    });

    /* ---------------- SEND EMAIL NOTIFICATION ---------------- */
    try {
      // 1. Fetch Project Details
      const project = await Project.findById(projectId).select(
        "projectName projectCode",
      );

      // 2. Fetch Current User (Action Performer)
      const currentUser = await User.findById(req.user.id).select("email name");

      // 3. Fetch ALL Developers on the Feed & Their Reporting Managers
      const allDevelopers = await User.find({
        _id: { $in: updatedFeed.developers },
      }).populate("reportingTo", "email name");

      const toEmails = [];
      const ccSet = new Set();

      // Add Current User to CC
      if (currentUser?.email) ccSet.add(currentUser.email);

      allDevelopers.forEach((dev) => {
        const isNewAssignment = developerIds.includes(dev._id.toString());

        // Add Reporting Manager to CC (for ALL developers on the feed)
        if (dev.reportingTo?.email) {
          ccSet.add(dev.reportingTo.email);
        }

        if (isNewAssignment) {
          // New developers go to 'To'
          if (dev.email) toEmails.push(dev.email);
        } else {
          // Existing developers go to 'Cc'
          if (dev.email) ccSet.add(dev.email);
        }
      });

      // Remove any 'To' emails from 'CC' to avoid duplication
      toEmails.forEach((email) => ccSet.delete(email));

      const ccList = Array.from(ccSet);

      if (toEmails.length > 0) {
        const emailHtml = `
          <div style="font-family: 'Inter', sans-serif; background-color: #f4f6f8; padding: 40px 10px; color: #1e293b;">
            <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
              
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #4f46e5 0%, #3d01b2 100%); padding: 30px 20px; text-align: center;">
                 <h1 style="margin: 0; font-size: 24px; color: #ffffff; letter-spacing: 0.5px;">You've Been Assigned</h1>
                 <p style="margin: 5px 0 0; color: #e0e7ff; font-size: 14px;">ACT-Nexus Notification</p>
              </div>

              <!-- Body -->
              <div style="padding: 30px;">
                <p style="font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 24px;">
                  Hello Team,
                </p>
                <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 30px;">
                  You have been assigned to the following feed in project <strong>${
                    project?.projectName || "Unknown Project"
                  }</strong>.
                </p>

                <!-- Feed Details Card -->
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
                   <table style="width: 100%; border-collapse: collapse;">
                     <tr>
                       <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600; width: 120px;">FEED NAME</td>
                       <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 500;">${
                         updatedFeed.feedName
                       }</td>
                     </tr>
                     <tr>
                       <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600;">FEED CODE</td>
                       <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 500;">${
                         updatedFeed.feedCode
                       }</td>
                     </tr>
                     <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600;">PLATFORM</td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 500;">${
                          updatedFeed.platformName
                        } (${updatedFeed.platformType})</td>
                     </tr>
                     <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600;">STATUS</td>
                        <td style="padding: 8px 0; color: #15803d; font-size: 14px; font-weight: 600;">${
                          updatedFeed.status
                        }</td>
                     </tr>
                   </table>
                </div>

                <div style="margin-top: 40px; text-align: center;">
                  <a href="http://172.28.161.32:3005/ACT-Nexus/" style="background-color: #4f46e5; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">View Feed</a>
                </div>
              </div>

              <!-- Footer -->
              <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                 <p style="margin: 0; font-size: 12px; color: #94a3b8;">© ${new Date().getFullYear()} Actowiz Solutions. All rights reserved.</p>
              </div>
            </div>
          </div>
        `;

        await sendMail({
          to: toEmails,
          cc: ccList,
          subject: `[${project?.projectCode}] ${project.projectName} - Assigned to Feed: ${updatedFeed.feedName}`,
          html: emailHtml,
        });

        console.log("Assignment email sent to:", toEmails, "CC:", ccList);
      }
    } catch (emailError) {
      console.error("Failed to send assignment email:", emailError);
    }

    return res.status(200).json({
      success: true,
      message: "Developers assigned successfully",
      data: updatedFeed,
    });
  } catch (error) {
    console.error("assignDevelopers error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to assign developers",
    });
  }
};

const feedupdated = async (req, res) => {
  try {
    const { id } = req.params;
    let updates = { ...req.body };

    console.log("Updated payload:", updates);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Feed ID" });
    }

    // ✅ Map frequencyConfig → feedfrequency
    if (updates.frequencyConfig) {
      updates.feedfrequency = updates.frequencyConfig;
      delete updates.frequencyConfig;
    }

    const oldFeed = await Feed.findById(id).lean();
    if (!oldFeed) {
      return res.status(404).json({ message: "Feed not found" });
    }

    const capFirst = (text = "") =>
      text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

    const feedNameFieldsChanged =
      updates.platformName ||
      updates.platformType ||
      updates.scopeType ||
      updates.feedfrequency ||
      updates.countries;

    if (feedNameFieldsChanged) {
      console.log("this is call ");
      const platformName = updates.platformName ?? oldFeed.platformName;

      const platformType = updates.platformType ?? oldFeed.platformType;

      const scopeType = updates.scopeType ?? oldFeed.scopeType;

      const frequencyType =
        updates.feedfrequency?.frequencyType ??
        oldFeed.feedfrequency.frequencyType;
      console.log("frequencyType", frequencyType);
      const countries = updates.countries ?? oldFeed.countries;

      updates.feedName = `${capFirst(platformName)}|${countries
        .map((c) => c.code)
        .join(",")}|${capFirst(platformType)}|${capFirst(scopeType)}|${capFirst(
        frequencyType,
      )}`;
    }
    const updatedFeed = await Feed.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true },
    );

    if (!updatedFeed) {
      return res.status(404).json({ message: "Feed not found" });
    }

    // 🔹 If developers updated → update project developers
    if (Array.isArray(updates.developers)) {
      const projectId = updatedFeed.projectId;

      // 1️⃣ Get ALL feeds under same project
      const allFeeds = await Feed.find({ projectId }, { developers: 1 });

      // 2️⃣ Union of all developers across feeds
      const projectDevelopers = [
        ...new Set(
          allFeeds.flatMap((f) => f.developers.map((d) => d.toString())),
        ),
      ];

      // 3️⃣ Update project safely (no duplicates, no accidental removal)
      await Project.findByIdAndUpdate(projectId, {
        $set: { developers: projectDevelopers },
      });
    }

    const oldData = {};
    const newData = {};

    Object.keys(updates).forEach((key) => {
      const oldValue = JSON.stringify(oldFeed[key] ?? null);
      const newValue = JSON.stringify(updatedFeed[key] ?? null);

      if (oldValue !== newValue) {
        oldData[key] = oldFeed[key] ?? null;
        newData[key] = updatedFeed[key] ?? null;
      }
    });
    await logFeedActivity({
      userid: req.user.id,
      username: req.user.name,
      feedId: updatedFeed._id,
      projectId: updatedFeed.projectId,
      newData: newData,
      oldData: oldData,
      actionTitle: "Feed has been updated",
    });

    return res.status(200).json({
      success: true,
      message: "Feed updated successfully",
      updatedBy: updates.updatedBy,
      data: updatedFeed,
    });
  } catch (error) {
    console.error("Feed update error:", error);
    console.log("error", error);
    return res.status(500).json({
      success: false,
      message: "Feed update failed",
    });
  }
};
const feedstatusupdate = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const feedId = new mongoose.Types.ObjectId(id);

    // 🔹 Validate input
    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const feed = await Feed.findById(id);

    if (!feed) {
      return res.status(404).json({ message: "Feed not found" });
    }

    const oldStatus = feed.status;

    if (oldStatus === status) {
      return res.status(200).json({ message: "Status already up to date" });
    }

    await Feed.updateOne({ _id: feedId }, { $set: { status } });

    await logFeedActivity({
      userid: req.user.id,
      username: req.user.name,
      feedId: feed._id,
      projectId: feed.projectId,
      actionTitle: "Feed Status Updated",
      oldData: oldStatus,
      newData: status,
    });

    return res.status(200).json({
      message: "Feed status updated successfully",
      data: {
        feedId: feed._id,
        oldStatus,
        newStatus: status,
      },
    });
  } catch (error) {
    console.error("Error updating feed status:", error);
    console.log(error);
    return res.status(500).json({ message: "Failed to update feed status" });
  }
};
const getfeedbyId = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid feed ID",
    });
  }
  try {
    const feed = await Feed.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id),
        },
      },

      /* ================= PROJECT MANAGER ================= */
      {
        $lookup: {
          from: "users",
          localField: "projectId",
          foreignField: "_id",
          pipeline: [{ $project: { name: 1, email: 1, roleId: 1 } }],
          as: "project",
        },
      },
      {
        $unwind: { path: "$projectManager", preserveNullAndEmptyArrays: true },
      },

      /* ================= DEVELOPERS ================= */
      {
        $lookup: {
          from: "users",
          localField: "developers",
          foreignField: "_id",
          pipeline: [{ $project: { name: 1, email: 1 } }],
          as: "developers",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          pipeline: [{ $project: { name: 1, email: 1 } }],
          as: "createdBy",
        },
      },
      { $unwind: { path: "$createdBy", preserveNullAndEmptyArrays: true } },
    ]);

    if (!feed.length) {
      return res.status(404).json({
        success: false,
        message: "Feed not found",
      });
    }

    const feedActivities = await FeedActivity.find({ feedId: id })
      .sort({ createdAt: -1 })
      .populate("ActionUserId", "name profileImage")
      .lean();

    return res.status(200).json({
      success: true,
      data: feed[0],
      feedActivities,
    });
  } catch (error) {
    console.error("Get Project By ID Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const feeddeleted = async (req, res) => {
  try {
    const { id } = req.params;
    const oldfeed = await Feed.findById(id).select("projectId feedName");
    console.log("oldfeed", oldfeed);
    const feed = await Feed.findByIdAndDelete(id);
    if (!feed) {
      return res.status(404).json({ message: "Feed not found" });
    }
    await logProjectActivity({
      userid: req.user.id,
      username: req.user.name,
      projectId: oldfeed.projectId,
      oldData: oldfeed.feedName,
      actionTitle: "Feed Deleted",
    });
    return res.status(200).json({ message: "Feed deleted successfully" });
  } catch (error) {
    console.error("Feed delete error:", error);
    return res.status(500).json({ message: "Feed delete failed" });
  }
};

module.exports = {
  getProject,
  ProjectIntegration,
  getFeedsByProject,
  Projectstatusupdate,
  feedActivestatusupdate,
  createFeed,
  getassignusers,
  assignteam,
  getdevelopers,
  assigndevelopers,
  getProjectbyId,
  projectUpdated,
  feedupdated,
  getfeedbyId,
  feedstatusupdate,
  feeddeleted,
};
