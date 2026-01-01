const express = require("express");
const router = express.Router();
const {
  userRegister,
  login,
  changePassword,
  getRoleBasePermission,
  sendotp
} = require("../controllers/AuthController");
const protect = require("../middleware/AuthMiddleware");

router.get("/checkAuth", protect, (req, res) => {
  res.json({ authenticated: true  , user: req.user});
});
router.post("/logout", (req, res) => {
  res.clearCookie("AuthToken", {
    domain: process.env.COOKIE_DOMAIN,
    path: "/",
  });
  res.json({ message: "Logged out successfully" });
});
router.post("/add-user", userRegister);
router.post("/login", login);
router.post("/send-otp", sendotp);
router.get("/get-rolebase-permission", protect, getRoleBasePermission);
router.post("/change-password", protect, changePassword);
module.exports = router;
