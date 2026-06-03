const mongoose = require("mongoose")

const locationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ["country", "state", "city", "area"], default: "city" },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Location" }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model("Location", locationSchema)
