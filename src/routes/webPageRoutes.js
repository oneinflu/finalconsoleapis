const express = require("express")
const WebPage = require("../models/WebPage")
const Category = require("../models/Category")
const Location = require("../models/Location")
const router = express.Router()

// Slugify helper
const slugify = (text) => {
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

const WebPageTemplate = require("../models/WebPageTemplate")

// Placeholder resolver
const resolvePlaceholders = (text, course, location) => {
  if (!text) return "";
  return text
    .replace(/\[course\]/gi, course)
    .replace(/\[location\]/gi, location);
}

// GET /web-pages
// Lists all generated web pages, optionally filtered by categoryId
router.get("/", async (req, res, next) => {
  try {
    const { categoryId } = req.query
    const query = categoryId ? { categoryId } : {}
    const pages = await WebPage.find(query)
      .populate("categoryId", "name")
      .populate("locationId", "name")
      .sort({ createdAt: -1 })
    res.json(pages)
  } catch (error) {
    next(error)
  }
})

// GET /web-pages/counts
// Returns counts of web pages grouped by categoryId
router.get("/counts", async (req, res, next) => {
  try {
    const counts = await WebPage.aggregate([
      {
        $group: {
          _id: "$categoryId",
          count: { $sum: 1 }
        }
      }
    ])
    
    // Convert array to key-value map for easier lookup: { [categoryId]: count }
    const countsMap = {}
    counts.forEach(item => {
      if (item._id) {
        countsMap[item._id.toString()] = item.count
      }
    })
    
    res.json(countsMap)
  } catch (error) {
    next(error)
  }
})

// POST /web-pages/generate
// Generates pages for a specific category for all locations in the system
router.post("/generate", async (req, res, next) => {
  try {
    const { categoryId } = req.body
    if (!categoryId) {
      return res.status(400).json({ error: "categoryId is required" })
    }

    const category = await Category.findById(categoryId)
    if (!category) {
      return res.status(404).json({ error: "Category not found" })
    }

    const locations = await Location.find({})
    if (locations.length === 0) {
      return res.status(400).json({ error: "No locations found in the system. Add locations first." })
    }

    // Fetch the global template
    let template = await WebPageTemplate.findOne({})
    if (!template) {
      // Create a default initial template if none exists
      template = new WebPageTemplate({
        title: "Best [course] course near me",
        h2: "Best [course] in [location]",
        content: "<p>Welcome to our premier [course] training institute in [location].</p>",
        image: "",
        altTag: "SEO Image",
        keywords: "best [course] in [location]",
        excerpt: "Get certified in [course] with top-rated training in [location].",
        authorName: "NorthStar Academy",
        sections: [{ title: "Why study [course] in [location]?", content: "<p>Studying [course] in [location] offers incredible career growth opportunities.</p>", cta: false }],
        faqs: [{ question: "What is the duration of [course] course in [location]?", answer: "The duration of [course] course in [location] is usually 6 to 12 months." }]
      })
      await template.save()
    }

    const categorySlug = category.slug || slugify(category.name)
    let generatedCount = 0

    for (const location of locations) {
      const locationSlug = slugify(location.name)
      const pageSlug = `${categorySlug}-in-${locationSlug}`

      // Check if already exists
      const existing = await WebPage.findOne({ slug: pageSlug })
      if (!existing) {
        // Resolve placeholders in all template strings
        const resolvedTitle = resolvePlaceholders(template.title, category.name, location.name)
        const resolvedH2 = resolvePlaceholders(template.h2, category.name, location.name)
        const resolvedContent = resolvePlaceholders(template.content, category.name, location.name)
        const resolvedKeywords = resolvePlaceholders(template.keywords, category.name, location.name)
        const resolvedExcerpt = resolvePlaceholders(template.excerpt, category.name, location.name)

        const resolvedSections = (template.sections || []).map(section => ({
          title: resolvePlaceholders(section.title, category.name, location.name),
          content: resolvePlaceholders(section.content, category.name, location.name),
          cta: section.cta
        }))

        const resolvedFaqs = (template.faqs || []).map(faq => ({
          question: resolvePlaceholders(faq.question, category.name, location.name),
          answer: resolvePlaceholders(faq.answer, category.name, location.name)
        }))

        const webPage = new WebPage({
          categoryId: category._id,
          locationId: location._id,
          title: resolvedTitle,
          h2: resolvedH2,
          content: resolvedContent,
          keywords: resolvedKeywords,
          excerpt: resolvedExcerpt,
          sections: resolvedSections,
          faqs: resolvedFaqs,
          slug: pageSlug,
          status: "generated"
        })
        await webPage.save()
        generatedCount++
      }
    }

    res.json({ 
      message: "Generation complete", 
      generatedCount,
      totalLocations: locations.length 
    })
  } catch (error) {
    next(error)
  }
})

// GET /web-pages/template
// Returns the global landing page content template
router.get("/template", async (req, res, next) => {
  try {
    let template = await WebPageTemplate.findOne({})
    if (!template) {
      // Create a default initial template if none exists
      template = new WebPageTemplate({
        title: "Default SEO Landing Title",
        h2: "Default Subtitle",
        content: "<p>Welcome to our landing page</p>",
        image: "",
        altTag: "SEO Image",
        keywords: "seo, landing",
        excerpt: "Global template summary description",
        authorName: "NorthStar Academy",
        sections: [{ title: "Welcome Section", content: "<p>Start building content...</p>", cta: false }],
        faqs: [{ question: "What is this?", answer: "This is a dynamically generated SEO lander." }]
      })
      await template.save()
    }
    res.json(template)
  } catch (error) {
    next(error)
  }
})

// POST /web-pages/update-content
// Updates the global landing page template content
router.post("/update-content", async (req, res, next) => {
  try {
    let template = await WebPageTemplate.findOne({})
    if (!template) {
      template = new WebPageTemplate(req.body)
    } else {
      // Update fields
      Object.assign(template, req.body)
    }
    await template.save()
    res.json({ message: "Web page content template updated successfully for all pages", template })
  } catch (error) {
    next(error)
  }
})

// GET /web-pages/:id
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params
    const page = await WebPage.findById(id)
      .populate("categoryId", "name")
      .populate("locationId", "name")
    
    if (!page) {
      return res.status(404).json({ error: "Web page not found" })
    }
    
    res.json(page)
  } catch (error) {
    next(error)
  }
})

// DELETE /web-pages/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params
    const page = await WebPage.findByIdAndDelete(id)
    if (!page) {
      return res.status(404).json({ error: "Web page not found" })
    }
    res.json({ message: "Web page deleted successfully" })
  } catch (error) {
    next(error)
  }
})

module.exports = router
