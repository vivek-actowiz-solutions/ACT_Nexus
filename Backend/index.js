


const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");

// Routes
const authRoutes = require("./routes/AuthRoutes");
const settingsRoutes = require("./routes/managementRoutes");
const projectRoutes = require("./routes/ProjectRoutes");
const workReportRoutes = require("./routes/WorkReportRoutes");
const dashboardRoutes = require("./routes/DashboardRoutes");
const escalationRoutes = require("./routes/EscalationRoutes");

const app = express();
const path = require('path');

app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'))
);
/* ===============================
   TRUST PROXY (IMPORTANT)
================================ */
app.set("trust proxy", 1);

/* ===============================
   GLOBAL MIDDLEWARES
================================ */
app.use(helmet());
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

/* ===============================
   CORS CONFIG (SAFE)
================================ */
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* ===============================
   RATE LIMITING (API PROTECTION)
================================ */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});

app.use("/api", apiLimiter);

/* ===============================
   REQUEST LOGGER (LIGHTWEIGHT)
================================ */
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.originalUrl}`);
    next();
  });
}

/* ===============================
   ROUTES
================================ */
app.use("/api", authRoutes);
app.use("/api", projectRoutes);
app.use("/api", settingsRoutes);
app.use("/api", workReportRoutes);
app.use("/api", dashboardRoutes);
app.use("/api", escalationRoutes);


/* ===============================
   GLOBAL ERROR HANDLER
================================ */
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

/* ===============================
   START SERVER (AFTER DB)
================================ */
const startServer = async () => {
  try {
    await connectDB(); // ✅ DB FIRST

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server Startup Failed:", error.message);
    process.exit(1);
  }
};

startServer();

/* ===============================
   GRACEFUL SHUTDOWN
================================ */
process.on("SIGINT", async () => {
  console.log("🛑 Shutting down server...");
  const mongoose = require("mongoose");
  await mongoose.connection.close();
  process.exit(0);
});
