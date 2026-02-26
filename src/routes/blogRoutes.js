const express = require("express")
const slugify = require("slugify")
const Blog = require("../models/Blog")
const BlogFaq = require("../models/BlogFaq")
const BlogSection = require("../models/BlogSection")

const router = express.Router()

// POST / - Create a new blog
router.post("/", async (req, res, next) => {
  try {
    const {
      title,
      h2,
      content, // initialContent
      categoryId,
      image,
      keywords,
      excerpt,
      altTag,
      authorName,
      sections, // Array of { title, content, cta }
      faqs,     // Array of { question, answer }
    } = req.body

    // 1. Generate Slug
    const slug = slugify(title, { lower: true, strict: true })
    
    // Check for duplicate slug
    let uniqueSlug = slug
    let counter = 1
    while (await Blog.findOne({ slug: uniqueSlug })) {
      uniqueSlug = `${slug}-${counter}`
      counter++
    }

    // 2. Create Blog Entry
    const newBlog = new Blog({
      title,
      h2,
      initialContent: content,
      categoryId,
      image,
      keywords,
      excerpt,
      altTag,
      authorName: authorName || "NorthStar Academy",
      slug: uniqueSlug,
      status: "DRAFT", // Default status
      date: new Date(), // Publish date defaults to now
      faqs: [],
      sections: []
    })

    const savedBlog = await newBlog.save()
    const blogId = savedBlog._id

    // 3. Create Sections
    if (sections && sections.length > 0) {
      const sectionDocs = sections.map(sec => ({
        section: sec.title,
        content: sec.content,
        cta: sec.cta ? "yes" : "no"
      }))
      
      const createdSections = await BlogSection.insertMany(sectionDocs)
      
      // Update Blog with Section IDs
      savedBlog.sections = createdSections.map(s => s._id)
    }

    // 4. Create FAQs
    if (faqs && faqs.length > 0) {
      const faqDocs = faqs.map(f => ({
        question: f.question,
        answer: f.answer
      }))

      const createdFaqs = await BlogFaq.insertMany(faqDocs)

      // Update Blog with FAQ IDs
      savedBlog.faqs = createdFaqs.map(f => f._id)
    }

    await savedBlog.save()

    res.status(201).json(savedBlog)
  } catch (error) {
    next(error)
  }
})

router.get("/", async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const { role, userId } = req.query // Pass role and userId from frontend (or middleware)

    let query = {}
    
    // If role is "Team Member", only show their own blogs
    // Note: Adjust role string match based on your exact DB role name (e.g., "team-member" vs "Team Member")
    // The user input said "Team Member"
    if (role === "Team Member" && userId) {
      query.author = userId
    }

    const blogs = await Blog.find(query)
      .sort({ createdAt: -1 }) // Sort by createdAt descending
      .skip(skip)
      .limit(limit)
      .populate("categoryId", "name") // Populate category name
      .select("title categoryId status date votes image approvedOn") // Ensure image is selected
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

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params
    
    // Try to find by Mongo _id first, if valid ObjectId
    let blog = null
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      blog = await Blog.findById(id)
        .populate("sections")
        .populate("faqs")
        .populate("categoryId", "name")
        .lean()
    }

    // If still not found, try by slug
    if (!blog) {
      blog = await Blog.findOne({ slug: id })
        .populate("sections")
        .populate("faqs")
        .populate("categoryId", "name")
        .lean()
    }

    if (!blog) {
      res.status(404).json({ error: "Blog not found" })
      return
    }

    res.json(blog)
  } catch (error) {
    next(error)
  }
})

// PUT /:id - Update a blog
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params
    const {
      title,
      h2,
      content, // initialContent
      categoryId,
      image,
      keywords,
      excerpt,
      altTag,
      authorName,
      sections, // Array of { title, content, cta }
      faqs,     // Array of { question, answer }
      status
    } = req.body

    const blog = await Blog.findById(id)
    if (!blog) {
      return res.status(404).json({ error: "Blog not found" })
    }

    // 1. Update basic fields
    blog.title = title
    blog.h2 = h2
    blog.initialContent = content
    blog.categoryId = categoryId
    blog.image = image
    blog.keywords = keywords
    blog.excerpt = excerpt
    blog.altTag = altTag
    blog.authorName = authorName
    if (status) blog.status = status

    // Update slug if title changed
    if (title && title !== blog.title) {
      const slug = slugify(title, { lower: true, strict: true })
      
      // Check for duplicate slug
      let uniqueSlug = slug
      let counter = 1
      while (await Blog.findOne({ slug: uniqueSlug, _id: { $ne: blog._id } })) {
        uniqueSlug = `${slug}-${counter}`
        counter++
      }
      blog.slug = uniqueSlug
    }

    // 2. Update Sections (Full Replacement Strategy for simplicity)
    // First, delete existing sections linked to this blog
    if (blog.sections && blog.sections.length > 0) {
      await BlogSection.deleteMany({ _id: { $in: blog.sections } })
    }
    
    // Create new sections
    let newSectionIds = []
    if (sections && sections.length > 0) {
      const sectionDocs = sections.map(sec => ({
        section: sec.title,
        content: sec.content,
        cta: sec.cta ? "yes" : "no"
      }))
      const createdSections = await BlogSection.insertMany(sectionDocs)
      newSectionIds = createdSections.map(s => s._id)
    }
    blog.sections = newSectionIds

    // 3. Update FAQs (Full Replacement Strategy)
    if (blog.faqs && blog.faqs.length > 0) {
      await BlogFaq.deleteMany({ _id: { $in: blog.faqs } })
    }

    let newFaqIds = []
    if (faqs && faqs.length > 0) {
      const faqDocs = faqs.map(f => ({
        question: f.question,
        answer: f.answer
      }))
      const createdFaqs = await BlogFaq.insertMany(faqDocs)
      newFaqIds = createdFaqs.map(f => f._id)
    }
    blog.faqs = newFaqIds

    await blog.save()

    res.json(blog)
  } catch (error) {
    next(error)
  }
})

// DELETE /:id - Delete a blog
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params

    const blog = await Blog.findById(id)
    if (!blog) {
      return res.status(404).json({ error: "Blog not found" })
    }

    // Delete related Sections and FAQs
    if (blog.sections && blog.sections.length > 0) {
      await BlogSection.deleteMany({ _id: { $in: blog.sections } })
    }
    if (blog.faqs && blog.faqs.length > 0) {
      await BlogFaq.deleteMany({ _id: { $in: blog.faqs } })
    }

    await Blog.findByIdAndDelete(id)

    res.json({ message: "Blog deleted successfully" })
  } catch (error) {
    next(error)
  }
})

module.exports = router
