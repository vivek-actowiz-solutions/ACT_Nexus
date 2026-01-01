const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const userModel = require("../models/UserModel");

const protect = async (req, res, next) => {
console.log("Cookies received:", req.cookies);

  const token = req.cookies.AuthToken;
  // console.log("token++++", token);
  if (!token) {
    return res.status(401).json({ Message: "Unauthorized. Token missing." , forceLogout: true});
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // attach user { id, role, email }
    const user = await userModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ Message: "User not found." });
    }
    const role = await mongoose.connection.db
      .collection("roles")
      .findOne({ _id: new mongoose.Types.ObjectId(user.roleId) });

    if (!role) {
      return res.status(403).json({ Message: "Role not found or removed." });
    }

    // ✅ Compare token version (auto logout if role updated)
    if (role.tokenVersion !== decoded.roleVersion) {
      return res.status(401).json({
        forceLogout: true,
        Message: "Session expired. Please login again.",
      });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ Message: "Token invalid or expired." });
  }
};

module.exports = protect;
