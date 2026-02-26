const mongoose = require("mongoose")

const blogSectionSchema = new mongoose.Schema(
  {
    section: String,
    content: String,
    cta: String
  },
  {
    timestamps: true
  }
)

const BlogSection = mongoose.model("BlogSection", blogSectionSchema)

module.exports = BlogSection
