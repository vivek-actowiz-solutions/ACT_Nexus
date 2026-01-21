const express = require("express");
const router = express.Router();
const {
  getProject,
  getFeedsByProject,
  ProjectIntegration,
  Projectstatusupdate,
  feedActivestatusupdate,
  getdevelopers,
  createFeed,
  getassignusers,
  assignteam,
  assigndevelopers,
  getProjectbyId,
  projectUpdated,
  feedupdated,
  getfeedbyId,
  feedstatusupdate,
  feeddeleted,
} = require("../controllers/ProjectController");
const protect = require("../middleware/AuthMiddleware");
const RolePermissionMiddleware = require("../middleware/RolePermissionMiddleware");
const upload = require("../utils/multer");

router.post(
  "/Project-Integration",
  protect,
  RolePermissionMiddleware("Projects"),
  upload.fields([
    { name: "sowDocument", maxCount: 20 },
    { name: "inputDocument", maxCount: 20 },
    { name: "annotationDocument", maxCount: 20 },
  ]),
  ProjectIntegration
);
router.get(
  "/Project-list",
  protect,
  RolePermissionMiddleware("Projects"),
  getProject
);
router.get(
  "/Project-list/:id",
  protect,
  RolePermissionMiddleware("Projects"),
  getProjectbyId
);

router.put(
  "/Project-update/:id",
  protect,
  RolePermissionMiddleware("Projects"),
  upload.fields([
    { name: "sowDocument", maxCount: 20 },
    { name: "inputDocument", maxCount: 20 },
    { name: "annotationDocument", maxCount: 20 },
  ]),
  projectUpdated
);
router.post("/project-assign-team", protect, assignteam);
router.put(
  "/projectstatusupdate/:id",
  protect,
  RolePermissionMiddleware("Projects"),
  Projectstatusupdate
);

router.post("/feed-create", protect, createFeed);
router.get(
  "/Feeds-list/:id",
  protect,
  RolePermissionMiddleware("Projects"),
  getFeedsByProject
);

router.get(
  "/feed-view/:id",
  protect,
  RolePermissionMiddleware("Projects"),
  getfeedbyId
);
router.put(
  "/feed-update/:id",
  protect,
  RolePermissionMiddleware("Projects"),
  feedupdated
);
router.delete(
  "/feed-deleted/:id",
  protect,
  RolePermissionMiddleware("Projects"),
  feeddeleted
);

router.put(
  "/feed-status-update/:id",
  protect,
  RolePermissionMiddleware("Projects"),
  feedstatusupdate
);
router.post(
  "/feed-assign-developers",
  protect,
  RolePermissionMiddleware("Projects"),
  assigndevelopers
);
router.get(
  "/project-assign-users",
  protect,
  RolePermissionMiddleware("Projects"),
  getassignusers
);
router.get(
  "/get-developers",
  protect,
  RolePermissionMiddleware("Projects"),
  getdevelopers
);
router.put(
  "/feedActivestatusupdate/:id",
  protect,
  RolePermissionMiddleware("Projects"),
  feedActivestatusupdate
);

module.exports = router;
