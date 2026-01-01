const Project = require("../models/ProjectModel");
const Feed = require("../models/FeedModel");
const User = require("../models/UserModel");
const ProjectActivity = require("../models/ProjectActivityLog");
const FeedActivity = require("../models/FeedActivityLog");
const logProjectActivity = require("../utils/ProjectactivityLogger");
const logFeedActivity = require("../utils/FeedactivityLogger");
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
    if (rolelevel === 3) {
      matchStage.department = department;
      matchStage.projectManager = userId;
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
      {
        $unwind: {
          path: "$projectCoordinator",
          preserveNullAndEmptyArrays: true,
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

    return res.status(200).json({
      success: true,
      data: project[0],
      projectActivities,
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
      projectPriority,
      projectFrequencyConfig,
      projectManager,
      projectTechManager,
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
      !projectFrequencyConfig ||
      !projectPriority ||
      !projectTechManager
    ) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
      });
    }
    let parsedProjectFrequency;

    try {
      parsedProjectFrequency =
        typeof projectFrequencyConfig === "string"
          ? JSON.parse(projectFrequencyConfig)
          : projectFrequencyConfig;
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid projectFrequencyConfig JSON format",
      });
    }
    // 🔹 3. Handle files safely
    const sowFiles = req.files?.sowDocument || [];
    const inputFiles = req.files?.inputDocument || [];
    const annotationFiles = req.files?.annotationDocument || [];

    // Store file paths as array (recommended)
    const sowDocumentPaths = sowFiles.map(
      (file) => `uploads/sowdocument/${file.filename}`
    );

    const inputDocumentPaths = inputFiles.map(
      (file) => `uploads/inputdocument/${file.filename}`
    );

    const annotationDocumentPaths = annotationFiles.map(
      (file) => `uploads/annotationDocument/${file.filename}`
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
      projectPriority,
      projectFrequency: parsedProjectFrequency,
      sowDocument: sowDocumentPaths,
      inputDocument: inputDocumentPaths,
      annotationDocument: annotationDocumentPaths,
      projectTechManager,
      projectManager,
      bde: salesPerson,
      status: "New",
      isActive: true,
      createdBy: userId || projectManager,
    });

    await logProjectActivity({
      userid: userId,
      username: req.user.name,
      projectId: project._id,
      actionTitle: "Project Created",
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
  
    if (rolelevel === 6) {
      query.developers = { $in: [req.user.id] };
    }
    // Fetch feeds for the given projectId
    const feeds = await Feed.find(query)
      .populate({
        path: "developers",
        select: "name",
      })
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
  const userId = new mongoose.Types.ObjectId(req.user.id);
  const { department } = req.query;

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

    
    const filterTl = {
      roleId: tlRole._id,
      department: department,
      status: true,
    };
    const filterPc = {
      roleId: pcRole._id,
    
      status: true,
    };


    if (rolelevel === 3) {
      filterTl.reportingTo = userId;
    }

    // 4️⃣ Fetch users
    const teamLeads = await User.find(filterTl)
      .select("_id name ")
      .sort({ name: 1 });
    const coordinators = await User.find(filterPc)
      .select("_id name ")
      .sort({ name: 1 });

    console.log("TeamLeads", teamLeads);
    return res.status(200).json({
      success: true,
      teamLeads: teamLeads,
      coordinators: coordinators,
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
  console.log("req.body ", req.body);
  try {
    const { projectId, teamLeadIds, projectCoordinatorId } = req.body;

    // Validate
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "Project ID is required",
      });
    }

    const projId = new mongoose.Types.ObjectId(projectId);

    // Convert Team Leads to ObjectId array
    const teamLeadObjectIds = (teamLeadIds || []).map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    const pcId = projectCoordinatorId
      ? new mongoose.Types.ObjectId(projectCoordinatorId)
      : null;
    const status = "Under Development";

    // Update Project
    const updatedProject = await Project.findByIdAndUpdate(
      projId,
      {
        // ✅ add multiple Team Leads without duplicates
        $addToSet: {
          teamLead: { $each: teamLeadObjectIds },
        },

        // ✅ set Project Coordinator
        ...(pcId && { projectCoordinator: pcId }),

        // ✅ update project status
        status: status,
      },
      { new: true }
    ).populate("teamLead projectCoordinator");

    if (!updatedProject) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const NewData = {
      teamLead: updatedProject.teamLead?.map((tl) => tl.name) || [],
      projectCoordinator: updatedProject.projectCoordinator
        ? updatedProject.projectCoordinator.name
        : null,
    };
    await logProjectActivity({
      userid: req.user.id,
      username: req.user.name,
      projectId: updatedProject._id,
      newData: NewData,
      actionTitle: "Team Lead(s) & Project Coordinator assigned",
    });
    await logProjectActivity({
      userid: req.user.id,
      username: req.user.name,
      projectId: updatedProject._id,
      newData: updatedProject.status,
      oldData: "New",
      actionTitle: "Project Status Updated",
    });
    return res.status(200).json({
      success: true,
      message: "Team Lead(s) & Project Coordinator assigned successfully",
      data: updatedProject,
    });
  } catch (error) {
    console.error("assign project TL/PC error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to assign Team Lead / Project Coordinator",
    });
  }
};
const createFeed = async (req, res) => {
  const {
    projectId,
    platformName,
    scopeType,
    platformType,
    frequencyType,
    countries,
    description,
    frequencyConfig,
  } = req.body;

  let parsedProjectFrequency;

  try {
    parsedProjectFrequency =
      typeof frequencyConfig === "string"
        ? JSON.parse(frequencyConfig)
        : frequencyConfig;
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid projectFrequencyConfig JSON format",
    });
  }
  const capFirst = (text = '') =>
  text.charAt(0).toUpperCase() + text.slice(1);

  
  const FeedName = `${capFirst(platformName)}|${countries
    .map((country) => country.code)
    .join(",")}|${platformType}|${scopeType}|${frequencyType}`;
  console.log("req.body", req.body, FeedName);

  const feed = await Feed.create({
    projectId: projectId,
    feedName: FeedName,
    platformName,
    platformType,
    scopeType,
    feedfrequency: parsedProjectFrequency,
    countries,
    description,
    status: "New",
    createdBy: req.user.id,
  });
  const project = await Project.findById(projectId);
  project.feedIds.push(feed._id);
  await project.save();

  await logFeedActivity({
    userid: req.user.id,
    username: req.user.name,
    projectId: projectId,
    feedId: feed._id,
    actionTitle: "Feed created",
  });
  newData = {
    feedId: feed._id,
    FeedName: feed.feedName,
  };
  await logProjectActivity({
    userid: req.user.id,
    username: req.user.name,
    projectId: projectId,
    actionTitle: "Feed created",
    newData: newData,
  });
  res.status(201).json({
    success: true,
    message: "Feed created successfully",
    data: feed,
  });
};
const feedActivestatusupdate = async (req, res) => {
  console.log("this this is calll");
  const { id } = req.params;

  console.log("id", id);
  const { active } = req.body;
  const userId = req.user.id;

  try {
    const feed = await Feed.findById(id);
    if (!feed) {
      return res.status(404).json({ message: "Feed not found" });
    }

    feed.active = active;
    await feed.save();

    await logFeedActivity({
      userid: userId,
      username: req.user.name,
      feedId: feed._id,
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
      "teamLead"
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
      (id) => new mongoose.Types.ObjectId(id)
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
      { new: true }
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
      { new: true }
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
  
    const capFirst = (text = '') =>
      text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();


    const feedNameFieldsChanged =
      updates.platformName ||
      updates.platformType ||
      updates.scopeType ||
      updates.feedfrequency ||
      updates.countries;

    if (feedNameFieldsChanged) {
      console.log("this is call ")
      const platformName =
        updates.platformName ?? oldFeed.platformName;

      const platformType =
        updates.platformType ?? oldFeed.platformType;

      const scopeType =
        updates.scopeType ?? oldFeed.scopeType;

      const frequencyType =
        updates.feedfrequency.frequencyType ?? oldFeed.feedfrequency.frequencyType;
console.log("frequencyType",frequencyType)
      const countries =
        updates.countries ?? oldFeed.countries;

      updates.feedName = `${capFirst(platformName)}|${countries
        .map((c) => c.code)
        .join(',')}|${capFirst(platformType)}|${capFirst(
        scopeType
      )}|${capFirst(frequencyType)}`;
    }
    const updatedFeed = await Feed.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
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
          allFeeds.flatMap((f) => f.developers.map((d) => d.toString()))
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

    // 🔹 Validate input
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

 


    const feed = await Feed.findById(id);

    if (!feed) {
      return res.status(404).json({ message: 'Feed not found' });
    }


    const oldStatus = feed.status;

   
    if (oldStatus === status) {
      return res.status(200).json({ message: 'Status already up to date' });
    }

 
    feed.status = status;
    await feed.save();

   
    await logFeedActivity({
      userid: req.user.id,
      username: req.user.name,
      feedId: feed._id,
      projectId: feed.projectId,
      actionTitle: 'Feed Status Updated',
      oldData: oldStatus,
      newData: status
    });

    return res.status(200).json({
      message: 'Feed status updated successfully',
      data: {
        feedId: feed._id,
        oldStatus,
        newStatus: status
      }
    });
  } catch (error) {
    console.error('Error updating feed status:', error);
    return res.status(500).json({ message: 'Failed to update feed status' });
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
  console.log("oldfeed" , oldfeed)
    const feed = await Feed.findByIdAndDelete(id);
    if (!feed) {
      return res.status(404).json({ message: "Feed not found" });
    }
    await logProjectActivity({
      userid: req.user.id,
      username: req.user.name,
      projectId: oldfeed.projectId,
      oldData : oldfeed.feedName,
      actionTitle: "Feed Deleted",
    })
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
  feedstatusupdate,feeddeleted
};
