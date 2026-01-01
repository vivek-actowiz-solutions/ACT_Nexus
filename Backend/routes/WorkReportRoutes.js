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
} = require("../controllers/WorkReportController");
const protect = require("../middleware/AuthMiddleware");
const RolePermissionMiddleware = require("../middleware/RolePermissionMiddleware");

router.post("/Add-WorkReport", protect, AddWorkReport);
router.get(
  "/work-reports",
  protect,
  RolePermissionMiddleware("WorkReport"),
  GetWorkReports
);
router.get("/project-workreport", getprojectworkreport);
router.get("/work-report-details", getworkreportDetails);
router.get("/Feeds-list-workreport/:id", protect, getFeedsByProjectworkreport);
router.get("/project-list-workreport", protect, getProjectlistworkreport);
router.get(
  "/get-users-list",
  protect,
  RolePermissionMiddleware("WorkReport"),
  getuserslist
);

module.exports = router;
