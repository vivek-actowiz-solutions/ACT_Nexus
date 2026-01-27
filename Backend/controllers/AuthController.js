const User = require("../models/UserModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const generatePassword = require("generate-password");
const sendMail = require("../utils/mailer");
const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");
const LoginHistory = require("../models/LoginHistoryLogModel");
const geoip = require("geoip-lite");
const UAParser = require("ua-parser-js");
const userRegister = async (req, res) => {
  const { name, email, roleId, designation, reportingTo, department } =
    req.body;
  console.log("req.body", req.body);

  try {
    // Check if user already exists
    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(400).json({ msg: "Email already exists" });
    }

    // Generate random strong password
    const password = generatePassword.generate({
      length: 8,
      numbers: true,
      uppercase: true,
      lowercase: true,
    });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Convert roleId string to ObjectId before saving
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      roleId: new mongoose.Types.ObjectId(roleId),
      reportingTo: reportingTo
        ? new mongoose.Types.ObjectId(reportingTo)
        : null,
      department,
      designation,
      originalPassword: password,
    });

    await newUser.save();

    // Email template (HTML)
    const emailHtml = `
<div style="font-family: 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f0f4f8; padding: 40px 10px; color: #1a202c;">
  <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">

    <!-- Top Gradient -->
    <div style="height: 6px; background: linear-gradient(90deg, #3d01b2, #7c3aed);"></div>

    <!-- Header -->
    <div style="padding: 40px 30px 20px; text-align: center;">
      <h1 style="margin: 0; font-size: 26px; color: #1e1b4b; letter-spacing: -0.5px;">
        Welcome to <span style="color: #3d01b2;">ACT-Nexus</span>
      </h1>
      <p style="color: #64748b; font-size: 16px; margin-top: 8px;">
        Your centralized dashboard for secure operations and insights.
      </p>
    </div>

    <!-- Body -->
    <div style="padding: 0 40px 40px;">
      <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
        Hello <strong>Dear User</strong>,
      </p>

      <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
        Your account for <strong>ACT-Nexus Dashboard</strong> has been successfully created.
        You now have access to manage system configurations, monitor data flows, and review
        operational reports in a secure environment.
      </p>

      <!-- Credentials -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 28px;">
        <div style="margin-bottom: 16px;">
          <span style="display: block; font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 700;">Registered Email</span>
          <span style="font-size: 16px; color: #1e1b4b; font-weight: 600;">${email}</span>
        </div>

        <div>
          <span style="display: block; font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 700;">Temporary Password</span>
          <code style="font-family: monospace; font-size: 18px; color: #3d01b2; font-weight: bold; background: #ede9fe; padding: 4px 10px; border-radius: 6px;">
            ${password}
          </code>
        </div>
      </div>

      <!-- Security Note -->
      <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 6px; margin-bottom: 30px;">
        <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.5;">
          <strong>Security Advisory:</strong> Please change your temporary password immediately after your first login to ensure account security.
        </p>
      </div>

      <!-- CTA -->
      <div style="text-align: center; margin-bottom: 30px;">
        <a href="http://172.28.161.32:3005/ACT-Nexus/"
           target="_blank"
           style="background-color: #3d01b2; color: #ffffff; padding: 16px 34px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 6px 12px rgba(61,1,178,0.25);">
          Access ACT-Nexus Dashboard
        </a>
      </div>
    <!-- Footer -->
    <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 28px; text-align: center;">
      <p style="margin: 0 0 10px; font-size: 13px; color: #94a3b8;">
        © ${new Date().getFullYear()} <strong>Actowiz Solutions</strong>. All rights reserved.
      </p>
      <div style="font-size: 13px;">
        <a href="https://www.actowizsolutions.com" style="color: #3d01b2; text-decoration: none; font-weight: 600;">Website</a>
        <span style="color: #cbd5e1; margin: 0 8px;">•</span>
        <span style="color: #64748b;">ACT-Nexus Platform</span>
      </div>
    </div>

  </div>
</div>

`;

    // Send email
    const emailSent = await sendMail({
      to: [email], // primary receiver
      cc: ["vivekpankhaniyaactowiz@gmail.com"], // CC receiver
      subject: "Your Account credentials for Actowiz Nexus Dashboard",
      html: emailHtml,
    });

    if (emailSent) {
      res.status(200).json({ msg: "User registered and email sent" });
    } else {
      res.status(500).json({ msg: "User registered but email failed" });
    }
    // res.status(200).json({ msg: "User registered and email sent" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// const login = async (req, res) => {
//   const { email, password } = req.body;
//   let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

//   // Clean if multiple IPs are present
//   if (ip && ip.includes(",")) {
//     ip = ip.split(",")[0].trim();
//   }

//   console.log("User IP:", ip);

//   try {
//     const user = await User.findOne({ email });
//     console.log("user", user);
//     if (!user) return res.status(404).json({ Message: "User not found" });
//     if (!user.status) {
//   return res
//     .status(403)
//     .json({ Message: "Your account is not active. Please contact support team." });
// }
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch)
//       return res.status(400).json({ Message: "Invalid credentials" });

//     const permission = await mongoose.connection.db
//       .collection("roles")
//       .findOne(
//         { _id: new ObjectId(user.roleId) },
//         { projection: { permissions: 1  , Rolelevel:1 , tokenVersion:1} }
//       );
//     console.log("permission", permission);

//     const token = jwt.sign(
//       { id: user._id, role: user.roleId, Rolelevel:permission.Rolelevel, name: user.name, email: user.email , roleVersion : permission.tokenVersion},
//       process.env.JWT_SECRET ,
//           { expiresIn: '1d' }
//     );
//     res.cookie("token", token, {
//       httpOnly: false,
//       secure: false, // you're using HTTP + IPs => must be false
//       sameSite: "Lax", // Lax allows cookie in normal browser POSTs
//       maxAge: 24 * 60 * 60 * 1000,
//     });
//     // console.log("permission", permission);
//     res.status(200).json({ Message: "Login successful", token, permission  , Rolelevel:permission.Rolelevel});
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ Message: "Server error" });
//   }
// };
const login = async (req, res) => {
  const { email, password } = req.body;
  let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  // 🧹 Clean multiple IPs (e.g., "192.168.0.1, 10.0.0.2")
  if (ip && ip.includes(",")) {
    ip = ip.split(",")[0].trim();
  }

  // 🧹 Remove IPv6 prefix "::ffff:"
  if (ip && ip.startsWith("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }

  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ Message: "User not found" });

    if (!user.status) {
      return res.status(403).json({
        Message: "Your account is not active. Please contact the support team.",
      });
    }

    // ✅ Password check
    const isMatch = await bcrypt.compare(password.trim(), user.password);
    if (!isMatch) return res.status(400).json({ Message: "Invalid password" });

    // ✅ Fetch permissions from roles collection
    const permission = await mongoose.connection.db
      .collection("roles")
      .findOne(
        { _id: new ObjectId(user.roleId) },
        { projection: { permissions: 1, Rolelevel: 1, tokenVersion: 1 } }
      );

    // ✅ Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.roleId,
        Rolelevel: permission?.Rolelevel,
        name: user.name,
        email: user.email,
        department: user.department,
        reportingTo: user.reportingTo,
        roleVersion: permission?.tokenVersion,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // ✅ Set cookie (valid 1 day)
    // res.cookie("AuthToken", token, {
    //   httpOnly: true,
    //   secure: true, // change to true when using HTTPS
    //   sameSite: "none",
    //   domain: ".actowizsolutions.com",
    //   maxAge: 24 * 60 * 60 * 1000,
    // });
    res.cookie("AuthToken", token, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true", // true for https
      sameSite: process.env.COOKIE_SAMESITE,
      domain: process.env.COOKIE_DOMAIN,
      maxAge: 24 * 60 * 60 * 1000,
    });

    // ✅ Detect location and device
    const geo = geoip.lookup(ip) || {};
    console.log(" geo", geo);
    const parser = new UAParser(req.headers["user-agent"]);
    console.log("parser", parser);
    const deviceInfo = parser.getResult();

    // ✅ Save login history in MongoDB
    await LoginHistory.create({
      userId: user._id,
      name: user.name,
      email: user.email,
      ip,
      location: {
        country: geo.country || "Unknown",
        city: geo.city || "Unknown",
        region: geo.region || "Unknown",
      },
      device: {
        browser: deviceInfo.browser.name || "Unknown",
        os: deviceInfo.os.name || "Unknown",
        deviceType: deviceInfo.device.type || "null",
      },
    });
    // ✅ Final response
    res.status(200).json({
      Message: "Login successful",
      token,
      permission,
      Rolelevel: permission?.Rolelevel,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ Message: "Server error" });
  }
};
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const { id } = req.user;
  try {
    const user = await User.findOne({ _id: id });
    if (!user) return res.status(404).json({ msg: "User not found" });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ msg: "Invalid current password" });
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.originalPassword = newPassword;
    await user.save();
    res.status(200).json({ msg: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

const getRoleBasePermission = async (req, res) => {
  console.log("req.user", req.user);
  const id = req.user.role;
  console.log("id", id);
  try {
    const permissions = await mongoose.connection.db
      .collection("roles")
      .findOne({ _id: new ObjectId(id) }, { projection: { permissions: 1 } });
    console.log("permissions", permissions);
    const moduleNames = permissions.permissions.map(
      (permission) => permission.moduleName
    );
    console.log("moduleNames", moduleNames);
    res.status(200).json(moduleNames);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

const sendotp = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Save OTP with expiry (optional: 5 mins)
    user.otp = otp;
    user.otpExpiry = Date.now() + 5 * 60 * 1000;
    await user.save();

    // Email template
    const emailHtml = `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background:#f5f7fa; color:#333; padding:20px;">
  <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:10px; box-shadow:0 4px 15px rgba(0,0,0,0.08); overflow:hidden;">

    <!-- Header -->
    <div style="padding:25px; text-align:center; background:#f3e8ff;">
      <h2 style="margin:0; font-size:22px; color:#3d01b2; font-weight:600;">Actowiz Solutions</h2>
      <p style="margin:5px 0 0; font-size:14px; color:#555;">Secure OTP Verification</p>
    </div>

    <!-- Body -->
    <div style="padding:30px;">
      <p style="font-size:15px; margin:0 0 16px;">
        Hello <strong>${user.name || "User"}</strong>,
      </p>

      <p style="font-size:15px; line-height:1.6; margin:0 0 20px; color:#444;">
        To complete your login, please use the following One-Time Password (OTP).  
        This OTP is valid for <strong>5 minutes</strong>.
      </p>

      <!-- OTP Card -->
      <div style="background:linear-gradient(135deg, #f3e8ff, #e0f2ff); border-radius:12px; padding:25px; margin-bottom:25px; text-align:center; box-shadow:0 3px 10px rgba(0,0,0,0.06);">
        <p style="margin:0; font-size:28px; letter-spacing:6px; color:#3d01b2; font-weight:bold;">
          ${otp}
        </p>
      </div>

      <p style="font-size:14px; line-height:1.6; color:#555; margin:0 0 25px;">
        ⚠️ <strong>Do not share this OTP</strong> with anyone. Our team will never ask for your OTP.  
        If you didn’t request this, please ignore this email.
      </p>

      <!-- CTA Button -->
      <div style="text-align:center; margin:25px 0;">
        <a href="http://172.28.148.176:3000/API-management/login" 
           target="_blank"
           style="color:#ffffff; background:#3d01b2; padding:12px 25px; border-radius:6px; text-decoration:none; font-size:16px; font-weight:600;">
          Verify & Login
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f5f7fa; text-align:center; padding:15px; font-size:13px; color:#777; border-top:1px solid #eee;">
      © ${new Date().getFullYear()} <strong>Actowiz Solutions</strong>. All rights reserved.  
      <br/>
      <a href="https://www.actowizsolutions.com" style="color:#3d01b2; text-decoration:none; font-weight:600;">Visit Our Website</a>
    </div>

  </div>
</div>
    `;

    // Send email
    const emailSent = await sendMail(
      email,
      "Your OTP Code - Actowiz Solutions",
      emailHtml
    );

    if (emailSent) {
      return res.status(200).json({ msg: "OTP sent successfully" });
    } else {
      return res.status(500).json({ msg: "Email sending failed" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

module.exports = {
  userRegister,
  login,
  changePassword,
  getRoleBasePermission,
  sendotp,
};
