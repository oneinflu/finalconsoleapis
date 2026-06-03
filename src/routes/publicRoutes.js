const express = require("express")
const Blog = require("../models/Blog")
const WebPage = require("../models/WebPage")
const Location = require("../models/Location")

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

// GET /public/seo-page/:slug - Fetch single generated landing page by slug
router.get("/seo-page/:slug", async (req, res, next) => {
  try {
    const { slug } = req.params

    const page = await WebPage.findOne({ slug })
      .populate("categoryId", "name")
      .populate("locationId", "name")
      .lean()

    if (!page) {
      return res.status(404).json({ error: "SEO page not found" })
    }

    res.json(page)
  } catch (error) {
    next(error)
  }
})

// GET /public/seo-pages - Fetch all generated landing pages for public links/sitemap
router.get("/seo-pages", async (req, res, next) => {
  try {
    const pages = await WebPage.find({ status: "generated" })
      .populate("categoryId", "name")
      .populate("locationId", "name")
      .select("slug title categoryId locationId createdAt")
      .lean()
    res.json(pages)
  } catch (error) {
    next(error)
  }
})

// GET /public/locations/countries - Fetch only countries
router.get("/locations/countries", async (req, res, next) => {
  try {
    const locations = await Location.find({ type: "country" }).sort({ name: 1 }).lean()
    res.json(locations)
  } catch (error) {
    next(error)
  }
})

// GET /public/locations/states - Fetch states (optionally filter by country parentId)
router.get("/locations/states", async (req, res, next) => {
  try {
    const { parentId } = req.query
    const query = { type: "state" }
    if (parentId) query.parentId = parentId
    const locations = await Location.find(query).sort({ name: 1 }).lean()
    res.json(locations)
  } catch (error) {
    next(error)
  }
})

// GET /public/locations/cities - Fetch cities (optionally filter by state parentId)
router.get("/locations/cities", async (req, res, next) => {
  try {
    const { parentId } = req.query
    const query = { type: "city" }
    if (parentId) query.parentId = parentId
    const locations = await Location.find(query).sort({ name: 1 }).lean()
    res.json(locations)
  } catch (error) {
    next(error)
  }
})

// GET /public/locations/areas - Fetch areas (optionally filter by city parentId)
router.get("/locations/areas", async (req, res, next) => {
  try {
    const { parentId } = req.query
    const query = { type: "area" }
    if (parentId) query.parentId = parentId
    const locations = await Location.find(query).sort({ name: 1 }).lean()
    res.json(locations)
  } catch (error) {
    next(error)
  }
})

// GET /public/locations - General locations search (supports type and parentId filters)
router.get("/locations", async (req, res, next) => {
  try {
    const { type, parentId } = req.query
    const query = {}
    if (type) query.type = type
    if (parentId) query.parentId = parentId
    const locations = await Location.find(query)
      .populate("parentId", "name type")
      .sort({ name: 1 })
      .lean()
    res.json(locations)
  } catch (error) {
    next(error)
  }
})

module.exports = router