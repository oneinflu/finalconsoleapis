const express = require("express")
const Blog = require("../models/Blog")

const router = express.Router()

// GET /public/blogs - Fetch APPROVED blogs with pagination
router.get("/blogs", async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const query = { status: "APPROVED" }

    const blogs = await Blog.find(query)
      .sort({ date: -1 }) // Sort by publish date descending
      .skip(skip)
      .limit(limit)
      .populate("categoryId", "name")
      .select("-sections -faqs") // Exclude heavy nested data for list view
      .lean()

    const total = await Blog.countDocuments(query)

    res.json({
      data: blogs,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    next(error)
  }
})

// GET /public/blogs/:slug - Fetch single APPROVED blog by slug
router.get("/blogs/:slug", async (req, res, next) => {
  try {
    const { slug } = req.params

    const blog = await Blog.findOne({ slug, status: "APPROVED" })
      .populate("sections")
      .populate("faqs")
      .populate("categoryId", "name")
      .lean()

    if (!blog) {
      return res.status(404).json({ error: "Blog not found" })
    }

    res.json(blog)
  } catch (error) {
    next(error)
  }
})

module.exports = router