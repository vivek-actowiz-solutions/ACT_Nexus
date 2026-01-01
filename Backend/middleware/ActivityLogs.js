// const ActivityLogs = require("../models/ActivityLog");

// const activityLogger = (action) => {
//   return async (req, res, next) => {
//     try {
//       const log = new ActivityLogs({
//         userId: req.user?.id,
//         action,
//         endpoint: req.originalUrl,
//         ipAddress: req.ip,
//       });
//       await log.save();
//     } catch (err) {
//       console.error("Error saving activity log:", err);
//     }
//     next();
//   };
// };

// module.exports = activityLogger;
