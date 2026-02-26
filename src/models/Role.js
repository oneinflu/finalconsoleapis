const mongoose = require("mongoose")

const roleSchema = new mongoose.Schema(
  {
    csvId: { type: String, unique: true }, // Added for migration linking
    roleName: { type: String, required: true }
  },
  { timestamps: true }
)

module.exports = mongoose.model("Role", roleSchema)
