const mongoose = require("mongoose")

const rolePermissionSchema = new mongoose.Schema(
  {
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: true }, // Links to Role ObjectId
    permissionId: { type: mongoose.Schema.Types.ObjectId, ref: "Permission", required: true } // Links to Permission ObjectId
  },
  { timestamps: true }
)

// Ensure unique combination of roleId and permissionId
rolePermissionSchema.index({ roleId: 1, permissionId: 1 }, { unique: true })

module.exports = mongoose.model("RolePermission", rolePermissionSchema)
