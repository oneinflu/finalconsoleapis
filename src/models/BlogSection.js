const mongoose = require("mongoose");

const blogSectionSchema = new mongoose.Schema(
  {
    section: String,
    content: String,
    cta: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SystemUser",
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SystemUser",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const BlogSection = mongoose.model("BlogSection", blogSectionSchema);

module.exports = BlogSection;
