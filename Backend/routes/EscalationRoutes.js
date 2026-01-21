const express = require("express");
const router = express.Router();
const {
  getEscalationProjects,
  getEscalationfeeds,
  getEscalationUsers,
  creatEsacalation,
  getEscalations,
  closeEscalation,
} = require("../controllers/EscalationController");
const protect = require("../middleware/AuthMiddleware");
const RolePermissionMiddleware = require("../middleware/RolePermissionMiddleware");

router.get(
  "/Escalation-projects",
  protect,
  RolePermissionMiddleware("Escalations"),
  getEscalationProjects
);
router.get(
  "/Escalation-feeds/:id",
  protect,
  RolePermissionMiddleware("Escalations"),
  getEscalationfeeds
);
router.get(
  "/Escalation-users/:id",
  protect,
  RolePermissionMiddleware("Escalations"),
  getEscalationUsers
);
router.post(
  "/create-escalation",
  protect,
  RolePermissionMiddleware("Escalations"),
  creatEsacalation
);
router.get(
  "/get-escalations",
  protect,
  RolePermissionMiddleware("Escalations"),
  getEscalations
);
router.post(
  "/close-escalation/:id",
  protect,
  RolePermissionMiddleware("Escalations"),
  closeEscalation
);

module.exports = router;
