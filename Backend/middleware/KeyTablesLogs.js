const key_tables_logs = require("../models/keytablesLogModel");

const keyTablesLogs = (action) => {
  return async (req, res, next) => {
    // Keep reference of original res.json
    const oldJson = res.json;

    res.json = async function (data) {
      try {
        // Capture keyId depending on action
        let keyId = null;
        let action_values = {};

        if (action === "Add_Key") {
          keyId = data?.newKey?._id; // from controller response
          action_values = data?.newKey || {};
        } else if (action === "Update_Key") {
          keyId = req.params.id;
          action_values = {
            updated_values:{
            limit: req.body?.limit,
            status: req.body?.status
            } ,
          };
        } else if (action === "Delete_Key") {
          keyId = req.params.id;
        } else if (action === "Restore_Key") {
          keyId = req.params.id;
        }

        if (keyId) {
          const log = new key_tables_logs({
            keyId,
            changedBy: req.user?.id,
            action,
            action_values,
          });
          await log.save();
          console.log(`✅ Logged action: ${action}`);
        }
      } catch (err) {
        console.error("❌ Error saving activity log:", err);
      }

      // Call original res.json with response
      return oldJson.call(this, data);
    };

    next();
  };
};

module.exports = keyTablesLogs;