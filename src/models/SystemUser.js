const mongoose = require("mongoose")

const systemUserSchema = new mongoose.Schema(
  {
    csvId: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: true },
    status: { type: String },
    course: { type: String }, // Can be comma-separated IDs
    phone: { type: String },
    supportCat: { type: String }
  },
  { timestamps: true }
)

module.exports = mongoose.model("SystemUser", systemUserSchema)
