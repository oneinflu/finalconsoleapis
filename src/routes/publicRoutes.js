const express = require("express")
const Blog = require("../models/Blog")
const WebPage = require("../models/WebPage")
const Location = require("../models/Location")
const schemaTemplate = require("../northstar-cpa-bengaluru-schema.json")

const slugify = (text) => {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start
    .replace(/-+$/, "") // Trim - from end
}

const generateSchema = (page) => {
  const course = page.categoryId?.name || ""
  const location = page.locationId?.name || ""
  const courseSlug = page.categoryId?.slug || slugify(course)
  const pageUrl = `https://northstaracad.com/${page.slug}`
  const excerpt = page.excerpt || `Join NorthStar Academy for the best ${course} coaching in ${location}. Expert faculty, structured batches, and proven results.`

  // Deep clone the JSON file so we never mutate the original
  const schema = JSON.parse(JSON.stringify(schemaTemplate))

  // [0] EducationalOrganization — fully static, no changes

  // [1] Course — dynamic fields
  schema[1]["@id"] = `${pageUrl}#course`
  schema[1].name = `Best ${course} Coaching in ${location}`
  schema[1].alternateName = `${course} Course ${location}`
  schema[1].description = excerpt
  schema[1].url = pageUrl
  schema[1].educationalCredentialAwarded = course
  schema[1].occupationalCredentialAwarded = course
  schema[1].teaches = page.sections && page.sections.length > 0
    ? page.sections.map(s => s.title).filter(Boolean)
    : schema[1].teaches
  schema[1].offers.url = pageUrl

  // [2] Person — fully static, no changes

  // [3] LocalBusiness — dynamic fields
  schema[3].name = `NorthStar Academy — ${course} Coaching ${location}`
  schema[3].description = excerpt
  schema[3].url = pageUrl

  // [4] WebPage — dynamic fields
  schema[4]["@id"] = `${pageUrl}#webpage`
  schema[4].url = pageUrl
  schema[4].name = `Best ${course} Coaching in ${location} | NorthStar Academy`
  schema[4].description = excerpt
  schema[4].about["@id"] = `${pageUrl}#course`
  schema[4].mainEntity["@id"] = `${pageUrl}#course`
  schema[4].breadcrumb.itemListElement[1].name = `${course} Course`
  schema[4].breadcrumb.itemListElement[1].item = `https://northstaracad.com/${courseSlug}-course-details`
  schema[4].breadcrumb.itemListElement[2].name = `Best ${course} Coaching in ${location}`
  schema[4].breadcrumb.itemListElement[2].item = pageUrl

  // [5] FAQPage — use actual FAQs from DB
  schema[5].mainEntity = (page.faqs || []).map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))

  return schema
}

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
      .populate("categoryId", "name slug")
      .populate("locationId", "name")
      .lean()

    if (!page) {
      return res.status(404).json({ error: "SEO page not found" })
    }

    page.schema = generateSchema(page)

    res.json(page)
  } catch (error) {
    next(error)
  }
})

// GET /public/sitemap-data - Fetch sitemap relevant data for generated landing pages
router.get("/sitemap-data", async (req, res, next) => {
  try {
    const pages = await WebPage.find({ status: "generated" })
      .populate("categoryId", "name slug")
      .populate("locationId", "name")
      .lean()

    const sitemapData = pages.map(page => {
      return {
        slug: page.slug,
        url: `https://northstaracad.com/${page.slug}`,
        createdAt: page.createdAt,
        updatedAt: page.updatedAt,
        priority: 0.8,
        changefreq: "weekly"
      }
    })

    res.json(sitemapData)
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