const mongoose = require("mongoose")

const blogSchema = new mongoose.Schema(
  {
    title: String,
    h2: String,
    initialContent: String,
    excerpt: String,
    image: String,
    date: Date,
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    slug: {
      type: String,
      index: true
    },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "SystemUser" },
    status: {
      type: String,
      enum: ["DRAFT", "APPROVED"],
      default: "DRAFT"
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "SystemUser" },
    approvedOn: Date,
    feedback: String,
    keywords: String,
    votes: Number,
    altTag: String,
    authorName: String,
    schemaMarkup: String,
    faqs: [{ type: mongoose.Schema.Types.ObjectId, ref: "BlogFaq" }],
    sections: [{ type: mongoose.Schema.Types.ObjectId, ref: "BlogSection" }]
  },
  {
    timestamps: true
  }
)

const Blog = mongoose.model("Blog", blogSchema)

module.exports = Blog
