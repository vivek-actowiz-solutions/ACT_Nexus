const express = require("express");
const router = express.Router();
const {
    getEscalationProjects,
    getEscalationfeeds , getEscalationUsers , creatEsacalation , getEscalations ,closeEscalation

} = require("../controllers/EscalationController");
const protect = require("../middleware/AuthMiddleware");
const RolePermissionMiddleware = require("../middleware/RolePermissionMiddleware");

router.get("/Escalation-projects", protect, getEscalationProjects);
router.get("/Escalation-feeds/:id", protect, getEscalationfeeds);
router.get("/Escalation-users/:id", protect, getEscalationUsers);
router.post("/create-escalation" ,protect, creatEsacalation);
router.get("/get-escalations" ,protect , getEscalations  );
router.post("/close-escalation/:id" , protect ,  closeEscalation );

module.exports = router;
