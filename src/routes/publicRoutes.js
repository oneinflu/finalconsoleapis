const express = require("express")
const Blog = require("../models/Blog")
const WebPage = require("../models/WebPage")
const Location = require("../models/Location")

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
  const locationSlug = page.locationId ? slugify(page.locationId.name) : ""

  const replacePlaceholders = (val) => {
    if (typeof val === "string") {
      return val
        .replace(/\[course\]/gi, course)
        .replace(/\[location\]/gi, location)
        .replace(/\[course-slug\]/gi, courseSlug)
        .replace(/\[location-slug\]/gi, locationSlug)
    } else if (Array.isArray(val)) {
      return val.map(replacePlaceholders)
    } else if (typeof val === "object" && val !== null) {
      const obj = {}
      for (const key in val) {
        obj[key] = replacePlaceholders(val[key])
      }
      return obj
    }
    return val
  }

  const schemaTemplate = [
    {
      "@context": "https://schema.org",
      "@type": "EducationalOrganization",
      "name": "NorthStar Academy",
      "url": "https://northstaracad.com",
      "logo": "https://northstaracad.com/logo.png",
      "description": "NorthStar Academy offers the best [course] coaching in [location] with expert faculty, structured batches, and proven results.",
      "areaServed": {
        "@type": "City",
        "name": "[location]"
      },
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "[course] Coaching Programs",
        "itemListElement": [
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Course",
              "name": "[course] Foundation Batch in [location]",
              "description": "Foundation level [course] preparation for students in [location]",
              "provider": {
                "@type": "Organization",
                "name": "NorthStar Academy"
              }
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Course",
              "name": "[course] Intensive Batch in [location]",
              "description": "Intensive [course] crash course for [location] students",
              "provider": {
                "@type": "Organization",
                "name": "NorthStar Academy"
              }
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Course",
              "name": "[course] Online Batch for [location]",
              "description": "Live online [course] classes for students in [location]",
              "provider": {
                "@type": "Organization",
                "name": "NorthStar Academy"
              }
            }
          }
        ]
      },
      "sameAs": [
        "https://www.facebook.com/northstaracademy",
        "https://www.instagram.com/northstaracademy",
        "https://www.youtube.com/@northstaracademy"
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://northstaracad.com"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "[course] Coaching",
          "item": "https://northstaracad.com/[course-slug]-coaching"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "[course] Coaching in [location]",
          "item": "https://northstaracad.com/best-[course-slug]-coaching-in-[location-slug]"
        }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Is NorthStar Academy the best [course] coaching in [location]?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "NorthStar Academy is among the top-rated [course] coaching institutes in [location], known for expert faculty, structured batches, and consistent results. Students from [location] have achieved top ranks in [course] through our proven methodology."
          }
        },
        {
          "@type": "Question",
          "name": "What [course] batches are available in [location]?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "NorthStar Academy offers Foundation, Intensive, Repeater, and Online batches for [course] in [location]. Each batch is designed to suit different preparation stages and schedules for [location] students."
          }
        },
        {
          "@type": "Question",
          "name": "How do I enrol for [course] coaching in [location]?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "You can enrol for [course] coaching in [location] by visiting our website, calling our [location] centre, or filling the enquiry form. Our counsellors will help you choose the right [course] batch based on your current preparation level."
          }
        },
        {
          "@type": "Question",
          "name": "Does NorthStar Academy offer online [course] classes for [location] students?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. NorthStar Academy offers live online [course] classes that [location] students can attend from home. The online batch covers the full [course] syllabus with the same faculty and test series as the offline batches."
          }
        }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Best [course] Coaching in [location] | NorthStar Academy",
      "description": "Join NorthStar Academy for the best [course] coaching in [location]. Expert faculty, structured batches, and proven results.",
      "url": "https://northstaracad.com/best-[course-slug]-coaching-in-[location-slug]",
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://northstaracad.com"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "[course] Coaching in [location]",
            "item": "https://northstaracad.com/best-[course-slug]-coaching-in-[location-slug]"
          }
        ]
      },
      "speakable": {
        "@type": "SpeakableSpecification",
        "cssSelector": ["h1", "h2", ".page-intro"]
      }
    }
  ]

  return replacePlaceholders(schemaTemplate)
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