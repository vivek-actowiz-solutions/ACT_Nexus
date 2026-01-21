const mongoose = require("mongoose");

const getModules = async (req, res) => {
  try {
    // use native collection
    const modules = await mongoose.connection.db
      .collection("modules")
      .find({})
      .toArray();

    res.status(200).json({
      success: true,
      message: "Modules fetched successfully",
      data: modules,
    });
  } catch (error) {
    console.error("Error fetching modules:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const getRoles = async (req, res) => {
  const permission = res.locals.permissions;
  console.log("permission in my api", permission);

  try {
    const { search = "" } = req.query;

    const query = {
      $or: [{ roleName: { $regex: search, $options: "i" } }],
    };
    // use native collection
    const roles = await mongoose.connection.db
      .collection("roles")
      .find(query)
      .toArray();

    res.status(200).json({
      message: "Roles fetched successfully",
      data: roles,
      permission,
    });
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
const getRolesname = async (req, res) => {
  const permission = res.locals.permissions;
  console.log("permission in my api", permission);

  try {
    const { search = "" } = req.query;

    const query = {
      $or: [{ roleName: { $regex: search, $options: "i" } }],
    };
    // use native collection
    const roles = await mongoose.connection.db
      .collection("roles")
      .find(query)
      .project({ roleName: 1 })
      .toArray();

    res.status(200).json({
      message: "Roles fetched successfully",
      data: roles,
    });
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
const updatePermissions = async (req, res) => {
  const { id } = req.params;
  const { permissions } = req.body;
  console.log("permissions", permissions);

  try {
    // use native collection
    await mongoose.connection.db
      .collection("roles")
      .updateOne(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: { permissions }, $inc: { tokenVersion: 1 } }
      );

    res.status(200).json({
      message: "Permissions updated successfully",
    });
  } catch (error) {
    console.error("Error updating permissions:", error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const getusers = async (req, res) => {
  const permission = res.locals.permissions;
  const canViewOriginalPassword = req.user.Rolelevel === 1;
  console.log("permission in my api", permission);

  try {
    // query params with defaults
    const { page = 1, limit = 10, search = "", roleId = "" } = req.query;
    console.log("get req.query", req.query);

    const pageNumber = parseInt(page) || 1;
    const pageLimit = parseInt(limit) || 10;
    const skip = (pageNumber - 1) * pageLimit;

    // build search filter
    const searchFilter = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { designation: { $regex: search, $options: "i" } },
          ],
        }
      : {};
    // combine search + role filter
    let finalFilter = { ...searchFilter };

    // ✅ If role filter is applied
    if (roleId && mongoose.Types.ObjectId.isValid(roleId)) {
      finalFilter.roleId = new mongoose.Types.ObjectId(roleId);
    }

    // aggregation pipeline
    const users = await mongoose.connection.db
      .collection("users")
      .aggregate([
        { $match: finalFilter }, // search filter
        { $sort: { createdAt: -1 } },
        {
          $lookup: {
            from: "roles", // roles collection
            localField: "roleId",
            foreignField: "_id",
            as: "roleInfo",
          },
        },
        { $unwind: { path: "$roleInfo", preserveNullAndEmptyArrays: true } }, // keep users even if no role
        {
          $lookup: {
            from: "users", // roles collection
            localField: "reportingTo",
            foreignField: "_id",
            as: "reportingUserInfo",
          },
        },
        {
          $unwind: {
            path: "$reportingUserInfo",
            preserveNullAndEmptyArrays: true,
          },
        }, // keep users even if no role
        {
          $project: {
            _id: 1,
            name: 1,
            email: 1,
            designation: 1,
            department: 1,
            reportingTo: "$reportingUserInfo.name",
            roleId: 1,
            status: 1,
            roleName: "$roleInfo.roleName",

            // ✅ Based on LOGIN ROLE LEVEL
            originalPassword: {
              $cond: {
                if: { $eq: [{ $literal: canViewOriginalPassword }, true] },
                then: "$originalPassword",
                else: "$$REMOVE",
              },
            },
          },
        },
        { $skip: skip },
        { $limit: pageLimit },
        { $sort: { createdAt: -1 } },
      ])
      .toArray();

    // get total count for pagination
    const total = await mongoose.connection.db
      .collection("users")
      .countDocuments(searchFilter);

    res.status(200).json({
      message: "Users fetched successfully",
      data: users,
      total,
      permission,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
const getReportingUsers = async (req, res) => {
  try {
    const { roleId, department } = req.query;

    if (!roleId) {
      return res.status(400).json({
        message: "roleId is required",
      });
    }

    const roleObjectId = new mongoose.Types.ObjectId(roleId);

    /**
     * STEP 1: Get current role details
     */
    const currentRole = await mongoose.connection.db
      .collection("roles")
      .findOne({ _id: roleObjectId });

    if (!currentRole) {
      return res.status(404).json({
        message: "Role not found",
      });
    }

    const currentRoleLevel = Number(currentRole.Rolelevel);
    const currentRoleName = currentRole.roleName;

    /**
     * STEP 2: Build conditional match
     * Admin & Manager → NO department filter
     * Others → SAME department only
     */
    let matchCondition = {
      $expr: {
        $lt: [{ $toInt: "$roleInfo.Rolelevel" }, currentRoleLevel],
      },
    };
    if (currentRoleName === "Admin") {
      matchCondition.$expr = {
        $lt: [{ $toInt: "$roleInfo.Rolelevel" }, currentRoleLevel],
      };
    }

    // 🔹 MANAGER → ONLY one level below
    else if (currentRoleName === "Manager") {
      if (!department) {
        return res.status(400).json({
          message: "department is required for Manager role",
        });
      }

      matchCondition.$expr = {
        $or: [
          // 🔹 One level below Manager (no department restriction)
          {
            $eq: [{ $toInt: "$roleInfo.Rolelevel" }, currentRoleLevel - 1],
          },

          // 🔹 Same Manager level WITH department OR "baka"
          {
            $and: [
              {
                $eq: [{ $toInt: "$roleInfo.Rolelevel" }, currentRoleLevel],
              },
              {
                $or: [
                  { $eq: ["$department", department] },
                  { $eq: ["$department", "Management"] },
                ],
              },
            ],
          },
        ],
      };
    }
    if (!["Admin", "Manager"].includes(currentRoleName)) {
      if (!department) {
        return res.status(400).json({
          message: "department is required for this role",
        });
      }
      matchCondition.department = department;
    }

    /**
     * STEP 3: Aggregate users
     */
    const users = await mongoose.connection.db
      .collection("users")
      .aggregate([
        {
          $lookup: {
            from: "roles",
            localField: "roleId",
            foreignField: "_id",
            as: "roleInfo",
          },
        },
        { $unwind: "$roleInfo" },

        { $match: matchCondition },

        {
          $project: {
            _id: 1,
            name: 1,
            email: 1,
            department: 1,
            roleId: 1,
            roleName: "$roleInfo.roleName",
            Rolelevel: "$roleInfo.Rolelevel",
          },
        },

        { $sort: { Rolelevel: 1 } },
      ])
      .toArray();

    return res.status(200).json({
      message: "Reporting users fetched successfully",
      data: users,
    });
  } catch (error) {
    console.error("getReportingUsers error:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
const getuserslist = async (req, res) => {
  const { department, manager, BDE } = req.query;

  if (!department) {
    return res.status(400).json({
      message: "department is required",
    });
  }

  try {
    /** Decide role filter */
    let roleFilter = {};

    if (manager === "true") {
      roleFilter = { "role.Rolelevel": 3 };
    }

    if (BDE === "true") {
      roleFilter = { "role.Rolelevel": 7 };
    }

    const users = await mongoose.connection.db
      .collection("users")
      .aggregate([
        /** Match department first */
        {
          $match: {
            department: department,
          },
        },

        /** Join roles collection */
        {
          $lookup: {
            from: "roles",
            localField: "roleId",
            foreignField: "_id",
            as: "role",
          },
        },
        { $unwind: "$role" },

        /** Role condition (Manager / BDE) */
        {
          $match: roleFilter,
        },

        /** Final response fields */
        {
          $project: {
            _id: 1,
            name: 1,
            roleName: "$role.roleName",
          },
        },
      ])
      .toArray();

    res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const updateuserstatus = async (req, res) => {
  const id = req.params.id;
  const { status } = req.body;
  console.log("status", status);
  try {
    const User = await mongoose.connection.db
      .collection("users")
      .updateOne(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: { status } }
      );
    if (!User) return res.status(404).json({ message: "user not found" });
    res.status(200).json({ message: "User status updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};
const updateUserRole = async (req, res) => {
  const id = req.params.id;
  const { roleId } = req.body;
  console.log(id, roleId);
  try {
    const User = await mongoose.connection.db
      .collection("users")
      .updateOne(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: { roleId: new mongoose.Types.ObjectId(roleId) } }
      );
    if (!User) return res.status(404).json({ message: "user not found" });
    res.status(200).json({ message: "User role updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};
module.exports = {
  getModules,
  getRoles,
  updatePermissions,
  getRolesname,
  getusers,
  updateuserstatus,
  updateUserRole,
  getReportingUsers,
  getuserslist,
};
