const mongoose = require("mongoose")

const permissionSchema = new mongoose.Schema(
  {
    csvId: { type: String, unique: true, required: true },
    groupName: { type: String, required: true },
    actionName: { type: String, required: true }
  },
  { timestamps: true }
)

module.exports = mongoose.model("Permission", permissionSchema)
