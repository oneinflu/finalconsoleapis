const mongoose = require("mongoose");

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
      index: true,
    },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "SystemUser" },
    status: {
      type: String,
      enum: ["DRAFT", "APPROVED"],
      default: "DRAFT",
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
    sections: [{ type: mongoose.Schema.Types.ObjectId, ref: "BlogSection" }],
    createdBy: String,
    deletedBy: String,
    updatedBy: String,
    deletedAt: String,
    metaTitle: {
      type: String,
      default: null,
    },

    canonicalUrl: {
      type: String,
      default: null,
    },
    updatedDate: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    metaRobotsIndex: {
      type: String,
      enum: ["index", "noindex"],
      default: "index",
    },
    metaRobotsFollow: {
      type: String,
      enum: ["follow", "nofollow"],
      default: "follow",
    },
  },
  {
    timestamps: true,
  },
);

const Blog = mongoose.model("Blog", blogSchema);

module.exports = Blog;
