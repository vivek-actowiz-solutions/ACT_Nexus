const mongoose = require("mongoose");

const RolePermissionMiddleware = (moduleName , action) => {
  console.log("==============this is call" ,moduleName);
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const RoleId = new mongoose.Types.ObjectId(req.user.role);
      //   console.log("=======++++++ this is RoleId", RoleId);
      const role = await mongoose.connection.db
        .collection("roles")
        .findOne({ _id: RoleId });
      //   console.log("------- this is role", role);
      if (!role) {
        return res.status(403).json({ message: "Role not found" });
      }

      if (moduleName) {
        const hasPermission = role.permissions?.filter(
          (perm) => perm.moduleName === moduleName
        );


        if (hasPermission.length === 0) {
          return res.status(403).json({ message: "Module   " });
        }
        if (action && !hasPermission[0].action.includes(action)) {
          return res.status(403).json({ message: "Forbidden" });
        }
      

console.log("hasPermission", hasPermission , action);
        //   res.locals.role = role.roleName;
        res.locals.permissions = hasPermission;
      } else {
        res.locals.permissions = role.permissions;
      }

      // continue
      next();
    } catch (err) {
      console.error("RolePermissionMiddleware error:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  };
};

module.exports = RolePermissionMiddleware;
