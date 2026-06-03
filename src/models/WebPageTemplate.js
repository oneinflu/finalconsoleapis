const mongoose = require("mongoose")

const webPageTemplateSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    h2: { type: String, required: true },
    content: { type: String, required: true },
    image: { type: String },
    altTag: { type: String },
    keywords: { type: String },
    excerpt: { type: String },
    authorName: { type: String },
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
    ]
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model("WebPageTemplate", webPageTemplateSchema)
