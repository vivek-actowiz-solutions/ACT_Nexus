const Project = require("../models/ProjectModel");
const Feed = require("../models/FeedModel");
const User = require("../models/UserModel");
const mongoose = require("mongoose");
const Escalations = require("../models/EscalationModel");
const sendMail = require("../utils/mailer");

const getEscalationProjects = async (req, res) => {
  const permission = res.locals.permissions;
  const userId = req.user?.id;
  try {
    // Assuming you have a Project model to fetch projects from the database
    const projects = await Project.find({ isActive: true }).select(
      "_id projectName projectCode"
    );
    res.status(200).json({ success: true, data: projects, permission, userId });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getEscalationfeeds = async (req, res) => {
  const { id } = req.params;
  try {
    // Assuming you have a Feed model to fetch feeds from the database
    const feeds = await Feed.find({ projectId: id }).select("_id feedName");
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
      .populate("projectManager", "name  department")
      .populate("csprojectManager", "name  department")
      .populate("projectTechManager", "name  department")
      .populate("teamLead", "name  department")
      .populate("developers", "name  department")
      .populate("projectCoordinator", "name  department")
      .populate("bde", "name  department");

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
          (u) => u.userId.toString() === user._id.toString()
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

    project.teamLead?.forEach((user) => pushUser(user, "Team Lead"));

    project.developers?.forEach((user) => pushUser(user, "Developer"));

    project.projectCoordinator?.forEach((user) =>
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

      const roleIds = roles.map((r) => r._id);

      // 🔹 Fetch admin users
      const adminUsers = await User.find({
        $or: [{ roleId: { $in: roleIds } }],
      }).select("_id name");

      adminUsers.forEach((admin) => pushUser(admin, "Admin"));
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
      // Severity,
      feed,
      status,
    } = req.body;

    if (!title || !description || !department || !assignTo || !project) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing watchers",
      });
    }

    const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

    if (!isValidObjectId(assignTo) || !isValidObjectId(project)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ObjectId provided",
      });
    }

    if (watchers && Array.isArray(watchers)) {
      const invalidwatchers = watchers.some((id) => !isValidObjectId(id));
      if (invalidwatchers) {
        return res.status(400).json({
          success: false,
          message: "Invalid watchers user ID",
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
      // Severity,
      feed: feed || null,
      status: status || "Open",
      createdBy: req.user?.id,
      createdbyName: req.user?.name,
    };

    const Escalationsdata = await Escalations.create(escalation);

    /* ---------------- SEND EMAIL NOTIFICATION ---------------- */
    try {
      const escalationDetails = await Escalations.findById(Escalationsdata._id)
        .populate({
          path: "assignTo",
          select: "email name",
          populate: { path: "reportingTo", select: "email name" },
        })
        .populate("project", "projectName projectCode")
        .populate("watchers", "email name")
        .populate("createdBy", "email name");

      const assignedUser = escalationDetails.assignTo;
      const projectDetails = escalationDetails.project;
      const creator = escalationDetails.createdBy;
      const watchersList = escalationDetails.watchers || [];

      const toEmails = [];
      const ccSet = new Set();

      if (assignedUser?.email) {
        toEmails.push(assignedUser.email);
        // Add Reporting Manager to CC
        if (assignedUser.reportingTo?.email) {
          ccSet.add(assignedUser.reportingTo.email);
        }
      }

      // Add Creator to CC
      if (creator?.email) ccSet.add(creator.email);

      // Add Watchers to CC
      watchersList.forEach((w) => {
        if (w.email) ccSet.add(w.email);
      });

      // Remove To emails from CC
      toEmails.forEach((email) => ccSet.delete(email));
      const ccEmails = Array.from(ccSet);

      if (toEmails.length > 0) {
        const emailHtml = `
          <div style="font-family: 'Inter', sans-serif; background-color: #fff1f2; padding: 40px 10px; color: #1e293b;">
            <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
              
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #e11d48 0%, #be123c 100%); padding: 30px 20px; text-align: center;">
                 <h1 style="margin: 0; font-size: 24px; color: #ffffff; letter-spacing: 0.5px;">New Escalation Assigned</h1>
                 <p style="margin: 5px 0 0; color: #ffe4e6; font-size: 14px;">Urgent Action Required</p>
              </div>

              <!-- Body -->
              <div style="padding: 30px;">
                <p style="font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 24px;">
                  Hello <strong>${assignedUser.name}</strong>,
                </p>
                <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 30px;">
                  You have been assigned a new escalation ticket. Please review the details below.
                </p>

                <!-- Details Card -->
                <div style="background-color: #fff0f1; border: 1px solid #fda4af; border-radius: 8px; padding: 20px;">
                   <table style="width: 100%; border-collapse: collapse;">
                     <tr>
                       <td style="padding: 8px 0; color: #9f1239; font-size: 13px; font-weight: 600; width: 120px;">TITLE</td>
                       <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${
                         escalationDetails.title
                       }</td>
                     </tr>
                     <tr>
                       <td style="padding: 8px 0; color: #9f1239; font-size: 13px; font-weight: 600;">PROJECT</td>
                       <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 500;">
                         ${projectDetails?.projectName || "N/A"}
                         <span style="color: #64748b; font-size: 12px;">(${
                           projectDetails?.projectCode || ""
                         })</span>
                       </td>
                     </tr>
                     <tr>
                        <td style="padding: 8px 0; color: #9f1239; font-size: 13px; font-weight: 600;">PRIORITY</td>
                        <td style="padding: 8px 0; color: #e11d48; font-size: 14px; font-weight: 700;">${
                          escalationDetails.priority
                        }</td>
                     </tr>
                     <tr>
                        <td style="padding: 8px 0; color: #9f1239; font-size: 13px; font-weight: 600;">DEPARTMENT</td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 500;">${
                          escalationDetails.department
                        }</td>
                     </tr>
                     <tr>
                        <td style="padding: 8px 0; color: #9f1239; font-size: 13px; font-weight: 600;">SLA DATE</td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 500;">${
                          escalationDetails.SLADate
                            ? new Date(escalationDetails.SLADate).toDateString()
                            : "N/A"
                        }</td>
                     </tr>
                   </table>
                </div>

                <div style="margin-top: 24px;">
                   <p style="font-size: 13px; font-weight: 600; color: #64748b; margin-bottom: 8px;">DESCRIPTION</p>
                   <div style="background: #f8fafc; padding: 15px; border-radius: 6px; font-size: 14px; line-height: 1.6; color: #334155; border: 1px solid #e2e8f0;">
                     ${escalationDetails.description}
                   </div>
                </div>

                <div style="margin-top: 40px; text-align: center;">
                  <a href="http://172.28.161.32:3005/ACT-Nexus/" style="background-color: #e11d48; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">View Escalation</a>
                </div>
              </div>

              <!-- Footer -->
              <div style="background-color: #fff1f2; padding: 20px; text-align: center; border-top: 1px solid #fda4af;">
                 <p style="margin: 0; font-size: 12px; color: #94a3b8;">© ${new Date().getFullYear()} Actowiz Solutions. All rights reserved.</p>
              </div>
            </div>
          </div>
        `;

        await sendMail({
          to: toEmails,
          cc: ccEmails,
          subject: `[ESCALATION] ${
            projectDetails?.projectCode
              ? `[${projectDetails.projectCode}] `
              : ""
          } ${projectDetails.projectName}`,
          html: emailHtml,
        });
        console.log("Escalation email sent to:", toEmails, "CC:", ccEmails);
      }
    } catch (emailError) {
      console.error("Failed to send escalation email:", emailError);
    }

    return res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      data: Escalationsdata,
    });
  } catch (error) {
    console.error("Create Ticket Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getEscalations = async (req, res) => {
  try {
    const { page = 1, limit = 6, search = "", status, department } = req.query;

    const skip = (page - 1) * limit;

    const query = {};

    if (status) query.status = status;
    if (department) query.department = department;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { createdbyName: { $regex: search, $options: "i" } },
        { assignToName: { $regex: search, $options: "i" } },
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

      Escalations.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Escalation fetch error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
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
    slaBreachReason,
  } = req.body;

  try {
    const escalation = await Escalations.findById(id);

    if (!escalation) {
      return res.status(404).json({
        success: false,
        message: "Escalation not found",
      });
    }

    // ❌ Prevent re-closing
    if (escalation.status === "Closed") {
      return res.status(400).json({
        success: false,
        message: "Escalation is already closed",
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
      slaBreachReason,
    };

    // ✅ Update status & closed date
    escalation.status = "Closed";
    escalation.closedAt = new Date();

    await escalation.save();

    /* ---------------- SEND CLOSURE EMAIL ---------------- */
    try {
      const escalationDetails = await Escalations.findById(id)
        .populate({
          path: "assignTo",
          select: "email name",
          populate: { path: "reportingTo", select: "email name" },
        })
        .populate("project", "projectName projectCode")
        .populate("watchers", "email name")
        .populate("createdBy", "email name");

      const creator = escalationDetails.createdBy;
      const assignedUser = escalationDetails.assignTo;
      const watchersList = escalationDetails.watchers || [];
      const projectDetails = escalationDetails.project;

      const toEmails = [];
      const ccSet = new Set();

      // Notification goes TO the Creator (Issue Resolved)
      if (creator?.email) {
        toEmails.push(creator.email);
      }

      // CC Assigned User
      if (assignedUser?.email) {
        ccSet.add(assignedUser.email);
      }

      // CC Assigned User's Reporting Manager
      if (assignedUser?.reportingTo?.email) {
        ccSet.add(assignedUser.reportingTo.email);
      }

      // CC Watchers
      watchersList.forEach((w) => {
        if (w.email) ccSet.add(w.email);
      });

      // Avoid duplicates
      toEmails.forEach((email) => ccSet.delete(email));
      const ccEmails = Array.from(ccSet);

      if (toEmails.length > 0 || ccEmails.length > 0) {
        // Fallback if no TO (e.g. creator deleted), send to CC as TO
        const finalTo = toEmails.length > 0 ? toEmails : ccEmails;
        const finalCC = toEmails.length > 0 ? ccEmails : [];

        const emailHtml = `
          <div style="font-family: 'Inter', sans-serif; background-color: #f0fdf4; padding: 40px 10px; color: #1e293b;">
            <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
              
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 30px 20px; text-align: center;">
                 <h1 style="margin: 0; font-size: 24px; color: #ffffff; letter-spacing: 0.5px;">Escalation Resolved</h1>
                 <p style="margin: 5px 0 0; color: #dcfce7; font-size: 14px;">Ticket Closed Successfully</p>
              </div>

              <!-- Body -->
              <div style="padding: 30px;">
                <p style="font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 24px;">
                  Hello <strong>${creator?.name || "Team"}</strong>,
                </p>
                <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 30px;">
                  The following escalation ticket has been marked as <strong>Closed</strong>.
                </p>

                <!-- Details Card -->
                <div style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 20px;">
                   <table style="width: 100%; border-collapse: collapse;">
                     <tr>
                       <td style="padding: 8px 0; color: #166534; font-size: 13px; font-weight: 600; width: 140px;">TITLE</td>
                       <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${
                         escalationDetails.title
                       }</td>
                     </tr>
                     <tr>
                       <td style="padding: 8px 0; color: #166534; font-size: 13px; font-weight: 600;">PROJECT</td>
                       <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 500;">
                         ${projectDetails?.projectName || "N/A"}
                       </td>
                     </tr>
                     <tr>
                        <td style="padding: 8px 0; color: #166534; font-size: 13px; font-weight: 600;">ROOT CAUSE</td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 500;">${
                          rootCauseCategory || "N/A"
                        }</td>
                     </tr>
                     ${
                       slaBreachReason
                         ? `<tr>
                             <td style="padding: 8px 0; color: #ef4444; font-size: 13px; font-weight: 600;">SLA BREACH</td>
                             <td style="padding: 8px 0; color: #ef4444; font-size: 14px; font-weight: 500;">${slaBreachReason}</td>
                           </tr>`
                         : ""
                     }
                   </table>
                </div>

                <div style="margin-top: 24px;">
                   <p style="font-size: 13px; font-weight: 600; color: #64748b; margin-bottom: 8px;">RESOLUTION / ACTION TAKEN</p>
                   <div style="background: #f8fafc; padding: 15px; border-radius: 6px; font-size: 14px; line-height: 1.6; color: #334155; border: 1px solid #e2e8f0;">
                     ${correctiveActionDescription || "No details provided."}
                   </div>
                </div>

                <div style="margin-top: 40px; text-align: center;">
                  <a href="http://172.28.161.32:3005/ACT-Nexus/" style="background-color: #16a34a; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">View Closed Ticket</a>
                </div>
              </div>

              <!-- Footer -->
              <div style="background-color: #f0fdf4; padding: 20px; text-align: center; border-top: 1px solid #86efac;">
                 <p style="margin: 0; font-size: 12px; color: #94a3b8;">© ${new Date().getFullYear()} Actowiz Solutions. All rights reserved.</p>
              </div>
            </div>
          </div>
        `;

        await sendMail({
          to: finalTo,
          cc: finalCC,
          subject: `[RESOLVED] ${
            projectDetails?.projectCode
              ? `[${projectDetails.projectCode}] `
              : ""
          }${escalationDetails.title}`,
          html: emailHtml,
        });

        console.log("Closure email sent to:", finalTo, "CC:", finalCC);
      }
    } catch (emailErr) {
      console.error("Failed to send closure email:", emailErr);
    }

    return res.status(200).json({
      success: true,
      message: "Escalation closed successfully",
      data: escalation,
    });
  } catch (error) {
    console.error("Close Escalation Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  getEscalationProjects,
  getEscalationfeeds,
  getEscalationUsers,
  creatEsacalation,
  getEscalations,
  closeEscalation,
};
