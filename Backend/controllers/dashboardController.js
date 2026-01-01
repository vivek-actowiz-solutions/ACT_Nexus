// const API_Config = require("../models/APIConfigrationModel");
// const connectDynamicDB = require("../config/GetdbConnection");
const getAPIbysearch = async (req, res) => {
  const rolelevel = req.user.Rolelevel;
  const userId = req.user.id;
  try {
    const { search = "" } = req.query;

    const query = {
      $or: [
        { apiName: { $regex: search, $options: "i" } },
        { domainName: { $regex: search, $options: "i" } },
        { categoryName: { $regex: search, $options: "i" } },
        { type: { $regex: search, $options: "i" } },
        { applicationType: { $regex: search, $options: "i" } },
      ],
    };
    if (rolelevel === 4) {
      query.customers = { $elemMatch: { customerId: userId } };
    }
    const data = await API_Config.find(query).sort({ _id: -1 });

    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// const getDashboardData = async (req, res) => {
//   // console.log("req.query", req.query);
//     const rolelevel = req.user.Rolelevel;
//   const userId = req.user.id;
//   const { ids, startDate, endDate } = req.query;
//   // console.log("req.query", req.query);
//   const idArray = ids ? ids.split(",") : [];

//   try {
//     // 1️⃣ Fetch all configs
//     const query = ids && idArray.length > 0 ? { _id: { $in: idArray } } : {};
//      if (rolelevel === 4) {
//       query.customers = { $elemMatch: { customerId: userId } };
//     }
//     const configs = await API_Config.find(query, {
//       _id: 1,
//       dbName: 1,
//       apiName: 1,
//       domainName: 1,
//     }).sort({ _id: -1 });

//     const TotalApi = configs.length;
//     let TotalLogs = 0;
//     let TotalSuccessLog = 0;
//     let TotalFailureLog = 0;

//     // 2️⃣ Run all DB queries in parallel
//     const results = await Promise.all(
//       configs.map(async (config) => {
//         try {
//           // Dynamic DB connection
//           const db = await connectDynamicDB(config.dbName);

//           const logs_table = `logs_table_${new Date().getFullYear()}_${String(
//             new Date().getMonth() + 1
//           ).padStart(2, "0")}`;

//           const logsCollection = db.collection(logs_table);
//           console.log("logsCollection", logsCollection.collectionName);

//           const baseQuery = {
//             vendor_name: { $regex: new RegExp(config.domainName, "i") },
//             key: {
//               $nin: [
//                 "87p6t2X5S33SsqQXbYIx64ENGGpdtj1g8ZwppQWK",
//                 "ISF2IYKT",
//                 "act_internal_test",
//               ],
//             },
//           };

//           if (startDate && endDate) {
//             baseQuery.request_time = {
//               $gte: startDate,
//               $lte: endDate,
//             };
//           }
//           // console.log("baseQuery", baseQuery);
//           const statusGroups = {
//             success: [200, 404],
//             fail: [504, 408, 502, 500, 422, 429, 401, 400, 201, 410, 500],
//           };

//           // 3️⃣ Run aggregation (Mongoose returns array directly)
//           const stats = await logsCollection.aggregate([
//             { $match: baseQuery },
//             {
//               $group: {
//                 _id: null,
//                 totalCount: { $sum: 1 },
//                 successCount: {
//                   $sum: {
//                     $cond: [
//                       { $in: ["$status_code", statusGroups.success] },
//                       1,
//                       0,
//                     ],
//                   },
//                 },
//                 failureCount: {
//                   $sum: {
//                     $cond: [{ $in: ["$status_code", statusGroups.fail] }, 1, 0],
//                   },
//                 },
//                  avgExecutionTime: { $avg: "$execution_time" }
//               },
//             },
//           ]);
//           const statsArray = await stats.toArray();
//           // console.log("statsArray", statsArray);
//           // ✅ Ensure we handle empty result
//           const {
//             totalCount = 0,
//             successCount = 0,
//             failureCount = 0,
//             avgExecutionTime=0
//           } = statsArray && statsArray.length > 0 ? statsArray[0] : {};

//           // update totals
//           TotalLogs += totalCount;
//           TotalSuccessLog += successCount;
//           TotalFailureLog += failureCount;

//           return {
//             _id: config._id,
//             dbName: config.dbName,
//             apiName: config.apiName,
//             totalCount,
//             successCount,
//             successPercentage:
//               totalCount === 0
//                 ? 0
//                 : ((successCount / totalCount) * 100).toFixed(2),
//             failureCount,
//             failurePercentage:
//               totalCount === 0
//                 ? 0
//                 : ((failureCount / totalCount) * 100).toFixed(2),
//                 avgExecutionTime
//           };
//         } catch (dbError) {
//           console.error(
//             `Error fetching logs for DB: ${config.dbName}`,
//             dbError
//           );
//           return {
//             _id: config._id,
//             dbName: config.dbName,
//             apiName: config.apiName,
//             successCount: 0,
//             totalCount: 0,
//             successPercentage: 0,
//             error: `Failed to fetch logs for ${config.dbName}`,
//           };
//         }
//       })
//     );

//     // 4️⃣ Send response
//     res.status(200).json({
//       data: results,
//       TotalApi,
//       successCount: TotalSuccessLog,
//       failureCount: TotalFailureLog,
//       totalCount: TotalLogs,
//     });
//   } catch (error) {
//     console.error("Error in getDashboardData:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

const getDashboardData = async (req, res) => {
  const rolelevel = req.user.Rolelevel;
  const userId = req.user.id;
  const username = req.user.name;
  const { ids, startDate, endDate } = req.query;
  console.log("req.query", req.query);
  const idArray = ids ? ids.split(",") : [];

  try {
    // 1️⃣ Fetch API Configs
    const query = ids && idArray.length > 0 ? { _id: { $in: idArray } } : {};
    if (rolelevel === 4) {
      query.customers = { $elemMatch: { customerId: userId } }
    }

    const configs = await API_Config.find(query, {
      _id: 1,
      dbName: 1,
      apiName: 1,
      domainName: 1,
    }).sort({ _id: -1 });


    const TotalApi = configs.length;
    let TotalLogs = 0;
    let TotalSuccessLog = 0;
    let TotalFailureLog = 0;

    // 2️⃣ Process all configs in parallel
    const results = await Promise.all(
      configs.map(async (config) => {
        try {
          const db = await connectDynamicDB(config.dbName);
   let customerKey = null;
          if (rolelevel === 4) {
            const keyCollection = db.collection("key_tables");
            const keyDoc = await keyCollection.findOne({ name: username });

            if (!keyDoc) {
              console.warn(`No key found for user ${username} in ${config.dbName}`);
              return {
                _id: config._id,
                dbName: config.dbName,
                apiName: config.apiName,
                totalCount: 0,
                successCount: 0,
                failureCount: 0,
                successPercentage: 0,
                failurePercentage: 0,
                avgExecutionTime: 0,
              };
            }
            customerKey = keyDoc.key;
          }
          const collections = await db.listCollections().toArray();
        const existingCollections = collections
    .map(c => c.name)
    .filter(name => name.startsWith("logs_table_"));

  let logCollections = [];

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Generate all months between start and end
    let current = new Date(start.getFullYear(), start.getMonth(), 1);
    while (current <= end) {
      const collectionName = `logs_table_${current.getFullYear()}_${String(current.getMonth() + 1).padStart(2, "0")}`;
      // Only add if collection actually exists
      if (existingCollections.includes(collectionName)) {
        logCollections.push(collectionName);
      }
      current.setMonth(current.getMonth() + 1); // Move to next month
    }
  } else {
    // No dates selected, get current month only
    const now = new Date();
    const collectionName = `logs_table_${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, "0")}`;
    if (existingCollections.includes(collectionName)) {
      logCollections.push(collectionName);
    }
  }
          console.log("logCollections", logCollections);
          if (logCollections.length === 0) {
            console.warn(`No log tables found in DB: ${config.dbName}`);
            return {
              _id: config._id,
              dbName: config.dbName,
              apiName: config.apiName,
              totalCount: 0,
              successCount: 0,
              failureCount: 0,
              successPercentage: 0,
              failurePercentage: 0,
              avgExecutionTime: 0,
            };
          }

          const statusGroups = {
            success: [200],
            fail: [400, 401, 403, 404, 408, 422, 429, 500, 502, 504 , 201 , 410],
          };

          
          const baseQuery = {
            vendor_name: { $regex: new RegExp(config.domainName, "i") },
          };
 if (rolelevel === 4 && customerKey) {
            baseQuery.key = customerKey;
          }
          if (startDate && endDate) {
            baseQuery.request_time = {
              $gte: startDate,
              $lte: endDate,
            };
          }

          // 2b️⃣ Aggregate from all collections
          const allStats = await Promise.all(
            logCollections.map(async (table) => {
              try {
                const logsCollection = db.collection(table);

                const stats = await logsCollection
                  .aggregate([
                    { $match: baseQuery },
                    {
                      $group: {
                        _id: null,
                        totalCount: { $sum: 1 },
                        successCount: {
                          $sum: {
                            $cond: [
                              { $in: ["$status_code", statusGroups.success] },
                              1,
                              0,
                            ],
                          },
                        },
                        failureCount: {
                          $sum: {
                            $cond: [
                              { $in: ["$status_code", statusGroups.fail] },
                              1,
                              0,
                            ],
                          },
                        },
                        avgExecutionTime: { $avg: "$execution_time" },
                      },
                    },
                  ])
                  .toArray();

                return (
                  stats[0] || {
                    totalCount: 0,
                    successCount: 0,
                    failureCount: 0,
                    avgExecutionTime: 0,
                  }
                );
              } catch (err) {
                console.error(`Error in table ${table}:`, err.message);
                return {
                  totalCount: 0,
                  successCount: 0,
                  failureCount: 0,
                  avgExecutionTime: 0,
                };
              }
            })
          );

          // 2c️⃣ Merge all months’ stats
          const merged = allStats.reduce(
            (acc, cur) => {
              acc.totalCount += cur.totalCount;
              acc.successCount += cur.successCount;
              acc.failureCount += cur.failureCount;
              acc.avgExecutionTime += cur.avgExecutionTime || 0;
              return acc;
            },
            {
              totalCount: 0,
              successCount: 0,
              failureCount: 0,
              avgExecutionTime: 0,
            }
          );

          merged.avgExecutionTime = allStats.length
            ? merged.avgExecutionTime / allStats.length
            : 0;

          // Update overall totals
          TotalLogs += merged.totalCount;
          TotalSuccessLog += merged.successCount;
          TotalFailureLog += merged.failureCount;

          return {
            _id: config._id,
            dbName: config.dbName,
            apiName: config.apiName,
            totalCount: merged.totalCount,
            successCount: merged.successCount,
            successPercentage:
              merged.totalCount === 0
                ? 0
                : ((merged.successCount / merged.totalCount) * 100).toFixed(2),
            failureCount: merged.failureCount,
            failurePercentage:
              merged.totalCount === 0
                ? 0
                : ((merged.failureCount / merged.totalCount) * 100).toFixed(2),
            avgExecutionTime: merged.avgExecutionTime.toFixed(2),
          };
        } catch (err) {
          console.error(`Error processing DB ${config.dbName}:`, err.message);
          return {
            _id: config._id,
            dbName: config.dbName,
            apiName: config.apiName,
            totalCount: 0,
            successCount: 0,
            failureCount: 0,
            successPercentage: 0,
            failurePercentage: 0,
            avgExecutionTime: 0,
          };
        }
      })
    );

    // 3️⃣ Send combined response
    res.status(200).json({
      data: results,
      TotalApi,
      totalCount: TotalLogs,
      successCount: TotalSuccessLog,
      failureCount: TotalFailureLog,
    });
  } catch (error) {
    console.error("Error in getDashboardData:", error);
    res.status(500).json({ message: error.message });
  }
};

const getAPIList = async (req, res) => {
  console.log("req.query", req.query);
  const { ids } = req.query;
  const idArray = ids ? ids.split(",") : [];
  try {
    const query = ids && idArray.length > 0 ? { _id: { $in: idArray } } : {};
    const configs = await API_Config.find(query, {
      _id: 1,
      dbName: 1,
      apiName: 1,
      domainName: 1,
    }).sort({ _id: -1 });
    console.log("configs", configs);
    res.status(200).json({ data: configs });
  } catch (error) {
    console.log("Error in getAPIList:", error);
    console.error("Error in getAPIList:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAPIbysearch,
  getDashboardData,
  getAPIList,
};
