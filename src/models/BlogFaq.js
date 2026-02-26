const mongoose = require("mongoose")

const blogFaqSchema = new mongoose.Schema(
  {
    question: String,
    answer: String
  },
  {
    timestamps: true
  }
)

const BlogFaq = mongoose.model("BlogFaq", blogFaqSchema)

module.exports = BlogFaq
