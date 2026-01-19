const Project  = require("../models/ProjectModel");
const Feed  = require("../models/FeedModel");
const User  = require("../models/UserModel");
const mongoose = require("mongoose");
const Escalations = require("../models/EscalationModel");

const getEscalationProjects = async (req, res) => {
    try {
        // Assuming you have a Project model to fetch projects from the database
        const projects = await Project.find({ isActive: true }).select('_id projectName');
        console.log("projectes" , projects )
        res.status(200).json({ success: true, data: projects });
    } catch (error) {
        console.error("Error fetching projects:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const getEscalationfeeds = async (req, res) => {
    const { id } = req.params;
    try {
        // Assuming you have a Feed model to fetch feeds from the database
        const feeds = await Feed.find({ projectId: id }).select('_id feedName');
        res.status(200).json({ success: true, data: feeds });
    } catch (error) {
        console.error("Error fetching feeds:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const getEscalationUsers = async (req, res) => {
  const { id } = req.params;
  const { isAdmin } = req.query;

  try {
    const project = await Project.findById(id)
      .populate("projectManager", "name  department" , )
      .populate("csprojectManager", "name  department" , )
      .populate("projectTechManager", "name  department" , )
      .populate("teamLead", "name  department" , )
      .populate("developers", "name  department" , )
      .populate("projectCoordinator", "name  department" , )
      .populate("bde", "name  department" , );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const escalationUsers = [];

    const pushUser = (user, role) => {
      if (
        user &&
        !escalationUsers.some(
          u => u.userId.toString() === user._id.toString()
        )
      ) {
        escalationUsers.push({
          userId: user._id,
          name: user.name,
          department: user.department,
          role,
        });
      }
    };

    // 🔹 Project Assigned Users
    pushUser(project.projectManager, "Project Manager");
    pushUser(project.csprojectManager, "CS Project Manager");
    pushUser(project.projectTechManager, "Tech Manager");
    pushUser(project.bde, "BDE");

    project.teamLead?.forEach(user =>
      pushUser(user, "Team Lead")
    );

    project.developers?.forEach(user =>
      pushUser(user, "Developer")
    );

    project.projectCoordinator?.forEach(user =>
      pushUser(user, "Project Coordinator")
    );

    // 🔥 Add Admin Users if isAdmin=true
    if (isAdmin === "true") {

      // 🔹 Get admin role IDs (Rolelevel = 2)
      const roles = await mongoose.connection.db
        .collection("roles")
        .find({ Rolelevel: { $in: [2] } })
        .project({ _id: 1 })
        .toArray();

      const roleIds = roles.map(r => r._id);

      // 🔹 Fetch admin users
      const adminUsers = await User.find({
        $or: [
          { roleId: { $in: roleIds } },
        ]
      }).select("_id name");

      adminUsers.forEach(admin =>
        pushUser(admin, "Admin")
      );
    }

    return res.status(200).json({
      success: true,
      totalUsers: escalationUsers.length,
      data: escalationUsers,
    });

  } catch (error) {
    console.error("Error fetching escalation users:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const creatEsacalation = async (req, res) => {
  try {
    const {
      title,
      description,
      department,
      priority,
      assignTo,
      assignToName,
      watchers,
      project,
      SLADate,
      Severity,
      feed,
      status
    } = req.body;

  
    if (!title || !description || !department || !assignTo || !project || !Severity) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing watchers"
      });
    }

  
    const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

    if (
      !isValidObjectId(assignTo) ||
      !isValidObjectId(project) 
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid ObjectId provided"
      });
    }

    if (watchers && Array.isArray(watchers)) {
      const invalidwatchers = watchers.some((id) => !isValidObjectId(id));
      if (invalidwatchers) {
        return res.status(400).json({
          success: false,
          message: "Invalid watchers user ID"
        });
      }
    }


    const escalation = {
      title: title.trim(),
      description: description.trim(),
      department,
      priority: priority || "Medium",
      assignTo,
      assignToName,
      watchers: watchers || [],
      project,
      SLADate: SLADate || null,
      Severity,
      feed : feed || null,
      status: status || "Open",
      createdBy: req.user?.id ,
      createdbyName: req.user?.name,
    };

   
    const Escalationsdata = await Escalations.create(escalation);

    return res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      data: Escalationsdata
    });
  } catch (error) {
    console.error("Create Ticket Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

const getEscalations = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 6,
      search = "",
      status,
      department
    } = req.query;

    const skip = (page - 1) * limit;

   
    const query = {};

    if (status) query.status = status;
    if (department) query.department = department;

    if (search) {
        query.$or = [
          { title: { $regex: search, $options: "i" } },
          { createdbyName: { $regex: search, $options: "i" } },
          { assignToName: { $regex: search, $options: "i" } }
        ];
      }

    const [data, total] = await Promise.all([
      Escalations.find(query)
        .populate("assignTo", "name designation")
        .populate("watchers", "name designation")
        .populate("project", "projectName ")
        .populate("feed", "feedName")
        .populate("closureDetails.actionOwner", "name designation")
        .populate("closureDetails.preventiveActionOwner", "name designation")
        .populate("createdBy", "name designation")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),

      Escalations.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      data,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Escalation fetch error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

const closeEscalation = async (req, res) => {
  const { id } = req.params;

  const {
    rootCauseCategory,
    rcaMethod,
    rcaDescription,

    correctiveActionDescription,
    actionType,
    actionOwner,
    dateImplemented,
    fixVerificationMethod,

    preventiveActionDescription,
    preventiveActionType,
    preventiveActionOwner,
    targetCompletionDate,
    preventiveActionStatus,
    slaBreachReason
  } = req.body;

  try {
    const escalation = await Escalations.findById(id);

    if (!escalation) {
      return res.status(404).json({
        success: false,
        message: "Escalation not found"
      });
    }

    // ❌ Prevent re-closing
    if (escalation.status === "Closed") {
      return res.status(400).json({
        success: false,
        message: "Escalation is already closed"
      });
    }

    // ✅ Update closure details
    escalation.closureDetails = {
      rootCauseCategory,
      rcaMethod,
      rcaDescription,

      correctiveActionDescription,
      actionType,
      actionOwner,
      dateImplemented,
      fixVerificationMethod,

      preventiveActionDescription,
      preventiveActionType,
      preventiveActionOwner,
      targetCompletionDate,
      preventiveActionStatus,
      slaBreachReason
    };

    // ✅ Update status & closed date
    escalation.status = "Closed";
    escalation.closedAt = new Date();

    await escalation.save();

    return res.status(200).json({
      success: true,
      message: "Escalation closed successfully",
      data: escalation
    });

  } catch (error) {
    console.error("Close Escalation Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

module.exports = {
    getEscalationProjects,getEscalationfeeds , getEscalationUsers , creatEsacalation  , getEscalations ,  closeEscalation
};