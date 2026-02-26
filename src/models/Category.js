const mongoose = require("mongoose")

const categorySchema = new mongoose.Schema(
  {
    csvId: { type: String, unique: true }, // To link back to CSV
    name: { type: String, required: true }, // 'name' column
    title: String, // 'title' column
    slug: { type: String, unique: true }, // 'slug' column
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" } // 'category' column (parent category)
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model("Category", categorySchema)
