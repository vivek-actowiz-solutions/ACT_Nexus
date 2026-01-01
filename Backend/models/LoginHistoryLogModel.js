const mongoose = require("mongoose");

const loginHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: String,
  email: String,
  ip: String,
  location: {
    country: String,
    city: String,
    region: String,
  },
  device: {
    browser: String,
    os: String,
    deviceType: String,
  },
  loginTime: { type: Date, default: Date.now },
});

module.exports = mongoose.model("LoginHistory", loginHistorySchema);

