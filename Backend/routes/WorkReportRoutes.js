const express = require("express");
const router = express.Router();
const {
  GetWorkReports,
  AddWorkReport,
  getprojectworkreport,
  getworkreportDetails,
  getuserslist,
  getFeedsByProjectworkreport,
  getProjectlistworkreport,
  getworklistbydate,
  updateWorkReport,
} = require("../controllers/WorkReportController");
const protect = require("../middleware/AuthMiddleware");
const RolePermissionMiddleware = require("../middleware/RolePermissionMiddleware");

router.post(
  "/Add-WorkReport",
  protect,
  RolePermissionMiddleware("WorkReport"),
  AddWorkReport
);
router.post(
  "/update-WorkReport",
  protect,
  RolePermissionMiddleware("WorkReport"),
  updateWorkReport
);
router.get(
  "/work-reports",
  protect,
  RolePermissionMiddleware("WorkReport"),
  GetWorkReports
);
router.get(
  "/project-workreport",
  protect,
  RolePermissionMiddleware("WorkReport"),
  getprojectworkreport
);
router.get(
  "/work-report-details",
  protect,
  RolePermissionMiddleware("WorkReport"),
  getworkreportDetails
);
router.get(
  "/work-list-workreport",
  protect,
  RolePermissionMiddleware("WorkReport"),
  getworklistbydate
);
router.get(
  "/Feeds-list-workreport/:id",
  protect,
  RolePermissionMiddleware("WorkReport"),
  getFeedsByProjectworkreport
);
router.get(
  "/project-list-workreport",
  protect,
  RolePermissionMiddleware("WorkReport"),
  getProjectlistworkreport
);
router.get(
  "/get-users-list",
  protect,
  RolePermissionMiddleware("WorkReport"),
  getuserslist
);

module.exports = router;
