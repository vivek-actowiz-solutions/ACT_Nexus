const express = require("express");
const router = express.Router();
const {
  getModules,
  getRoles,
  updatePermissions,
  getusers,
  updateuserstatus,
  updateUserRole,
  getRolesname,
  getReportingUsers,
  getuserslist,
} = require("../controllers/managementController");

const protect = require("../middleware/AuthMiddleware");
const RolePermissionMiddleware = require("../middleware/RolePermissionMiddleware");
// router.post("/userRegister", userRegister);
router.get("/get-modules", getModules);
router.get("/get-roles", protect, RolePermissionMiddleware("Role"), getRoles);
router.get("/get-roles-name", protect, getRolesname);
router.put("/update-role-permissions/:id", updatePermissions);
router.get("/get-user", protect, RolePermissionMiddleware("User"), getusers);
router.get(
  "/get-reporting-users", 
  protect,
  RolePermissionMiddleware("User"),
  getReportingUsers
);

router.get(
  "/users-list",
  protect,
  getuserslist
);

router.put("/update-user-role/:id", updateUserRole);
router.put("/user-status/:id", updateuserstatus);
// router.post("/login", login);
// router.post("/change-password", protect, changePassword);
module.exports = router;
