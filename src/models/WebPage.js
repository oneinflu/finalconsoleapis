const mongoose = require("mongoose")

const webPageSchema = new mongoose.Schema(
  {
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true },
    title: { type: String, required: true },
    h2: { type: String, required: true },
    content: { type: String, required: true },
    keywords: { type: String },
    excerpt: { type: String },
    sections: [
      {
        title: String,
        content: String,
        cta: Boolean
      }
    ],
    faqs: [
      {
        question: String,
        answer: String
      }
    ],
    slug: { type: String, required: true, unique: true },
    status: { type: String, default: "generated" },
    schema: { type: mongoose.Schema.Types.Mixed }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model("WebPage", webPageSchema)
