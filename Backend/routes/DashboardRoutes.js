const express = require("express");
const router = express.Router();
const {
  getProjectAndFeedCount, getFeedFrequency
} = require("../controllers/dashboardController");
const protect = require("../middleware/AuthMiddleware");
// const RolePermissionMiddleware = require("../middleware/RolePermissionMiddleware");



router.get("/project-feed-count",protect , getProjectAndFeedCount);
router.get("/feed-frequency",protect , getFeedFrequency);

module.exports = router;