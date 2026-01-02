const express = require("express");
const router = express.Router();
const {
getProjectAndFeedCount
} = require("../controllers/dashboardController");
const protect = require("../middleware/AuthMiddleware");
// const RolePermissionMiddleware = require("../middleware/RolePermissionMiddleware");



router.get("/project-feed-count" , getProjectAndFeedCount);

module.exports = router;
