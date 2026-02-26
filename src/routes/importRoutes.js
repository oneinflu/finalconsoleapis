const express = require("express")
const multer = require("multer")
const { parse } = require("csv-parse/sync")
const Blog = require("../models/Blog")
const BlogFaq = require("../models/BlogFaq")
const BlogSection = require("../models/BlogSection")
const SystemUser = require("../models/SystemUser")
const Role = require("../models/Role")
const Permission = require("../models/Permission")
const RolePermission = require("../models/RolePermission")
const Category = require("../models/Category")

const router = express.Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024
  }
})

const parseCsvBuffer = buffer => {
  const text = buffer.toString("utf8")
  return parse(text, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
    ltrim: true,
    rtrim: true,
    quote: '"',
    escape: '"'
  })
}

router.post("/blogs", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "CSV file is required" })
      return
    }

    const rows = parseCsvBuffer(req.file.buffer)

    // Fetch all system users to map approvedBy/author
    const users = await SystemUser.find({})
    const userMap = {}
    users.forEach(u => {
      userMap[u.csvId] = u._id
    })

    const docs = rows.map(row => {
      const date = row.date ? new Date(row.date) : null
      const approvedOn = row.approvedOn ? new Date(row.approvedOn) : null
      const votes = row.votes ? Number(row.votes) : undefined

      // Map approvedBy and author to ObjectIds if possible
      const approvedBy = userMap[row.approvedby] || null
      const author = userMap[row.author] || null

      return {
        csvId: row.id, // Keep temporarily for linking FAQs/Sections
        title: row.title || null,
        h2: row.h2 || null,
        initialContent: row.initialContent || null,
        excerpt: row.excerpt || null,
        image: row.image || null,
        date: Number.isNaN(date?.getTime()) ? null : date,
        categoryId: row.categoryID || null,
        slug: row.slug || null,
        author: author,
        status: row.status || null,
        approvedBy: approvedBy,
        approvedOn: Number.isNaN(approvedOn?.getTime()) ? null : approvedOn,
        feedback: row.feedback || null,
        keywords: row.keywords || null,
        votes: Number.isNaN(votes) ? null : votes,
        altTag: row.altTag || null,
        authorName: row.authorName || null,
        schemaMarkup: row.schemaMarkup || null,
        faqs: [], // Initialize empty
        sections: [] // Initialize empty
      }
    })

    await Blog.deleteMany({})
    const result = await Blog.insertMany(docs)

    res.json({
      imported: result.length,
      message: "Blogs imported. Now upload FAQs and Sections to link them."
    })
  } catch (error) {
    next(error)
  }
})

router.post("/blog-faqs", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "CSV file is required" })
      return
    }

    const rows = parseCsvBuffer(req.file.buffer)
    
    // We retain csvId and blogCsvId in the schema now
    const docs = rows.map(row => ({
      csvId: row.id,
      blogCsvId: row.blog,
      question: row.question || null,
      answer: row.answer || null
    }))

    await BlogFaq.deleteMany({})
    const createdFaqs = await BlogFaq.insertMany(docs)

    // Link to Blogs
    const blogs = await Blog.find({})
    const blogMap = {}
    blogs.forEach(b => {
      if (b.csvId) blogMap[b.csvId] = b._id
    })

    let linkedCount = 0
    for (const faq of createdFaqs) {
      const blogId = blogMap[faq.blogCsvId]
      if (blogId) {
        await Blog.updateOne({ _id: blogId }, { $addToSet: { faqs: faq._id } }) // Use addToSet to avoid duplicates
        linkedCount++
      }
    }

    res.json({
      imported: createdFaqs.length,
      linked: linkedCount
    })
  } catch (error) {
    next(error)
  }
})

router.post("/blog-sections", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "CSV file is required" })
      return
    }

    const rows = parseCsvBuffer(req.file.buffer)

    const docs = rows.map(row => ({
      csvId: row.id,
      blogCsvId: row.blog,
      section: row.section || null,
      content: row.content || null,
      cta: row.cta || null
    }))

    await BlogSection.deleteMany({})
    const createdSections = await BlogSection.insertMany(docs)

    // Link to Blogs
    const blogs = await Blog.find({})
    const blogMap = {}
    blogs.forEach(b => {
      if (b.csvId) blogMap[b.csvId] = b._id
    })

    let linkedCount = 0
    for (const section of createdSections) {
      const blogId = blogMap[section.blogCsvId]
      if (blogId) {
        await Blog.updateOne({ _id: blogId }, { $addToSet: { sections: section._id } })
        linkedCount++
      }
    }

    res.json({
      imported: createdSections.length,
      linked: linkedCount
    })
  } catch (error) {
    next(error)
  }
})

router.post("/system-users", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "CSV file is required" })
      return
    }

    const rows = parseCsvBuffer(req.file.buffer)

    const docs = rows.map(row => ({
      csvId: row.id,
      name: row.name,
      email: row.email,
      password: row.password,
      roleId: row.role_id,
      status: row.status || null,
      course: row.course || null,
      phone: row.phone || null,
      supportCat: row.supportCat || null
    }))

    await SystemUser.deleteMany({})
    const result = await SystemUser.insertMany(docs)

    res.json({
      imported: result.length
    })
  } catch (error) {
    next(error)
  }
})

router.post("/roles", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "CSV file is required" })
      return
    }

    const rows = parseCsvBuffer(req.file.buffer)

    const docs = rows.map(row => ({
      csvId: row.id,
      roleName: row.role_name
    }))

    await Role.deleteMany({})
    const result = await Role.insertMany(docs)

    res.json({
      imported: result.length
    })
  } catch (error) {
    next(error)
  }
})

router.post("/permissions", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "CSV file is required" })
      return
    }

    const rows = parseCsvBuffer(req.file.buffer)

    const docs = rows.map(row => ({
      csvId: row.id,
      groupName: row.group_name,
      actionName: row.action_name
    }))

    await Permission.deleteMany({})
    const result = await Permission.insertMany(docs)

    res.json({
      imported: result.length
    })
  } catch (error) {
    next(error)
  }
})

router.post("/role-permissions", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "CSV file is required" })
      return
    }

    const rows = parseCsvBuffer(req.file.buffer)

    // Fetch all Roles to map role_id (csvId) to _id
    const roles = await Role.find({})
    const roleMap = {}
    roles.forEach(r => {
      if (r.csvId) roleMap[r.csvId] = r._id
    })

    // Fetch all Permissions to map permission_id (csvId) to _id
    const permissions = await Permission.find({})
    const permMap = {}
    permissions.forEach(p => {
      if (p.csvId) permMap[p.csvId] = p._id
    })

    const docs = []
    let skipped = 0

    for (const row of rows) {
        const roleObjectId = roleMap[row.role_id]
        const permObjectId = permMap[row.permission_id]
        
        if (roleObjectId && permObjectId) {
            docs.push({
                roleId: roleObjectId,
                permissionId: permObjectId
            })
        } else {
            skipped++
        }
    }

    await RolePermission.deleteMany({})
    const result = await RolePermission.insertMany(docs)

    res.json({
      imported: result.length,
      skipped: skipped
    })
  } catch (error) {
    next(error)
  }
})

router.post("/categories", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "CSV file is required" })
      return
    }

    const rows = parseCsvBuffer(req.file.buffer)

    // Filter duplicates by slug before inserting
    const docsWithParent = []
    const slugs = new Set()

    for (const row of rows) {
      if (row.slug && slugs.has(row.slug)) continue
      if (row.slug) slugs.add(row.slug)

      docsWithParent.push({
        csvId: row.id,
        name: row.name,
        title: row.title,
        slug: row.slug || null,
        parentCsvId: row.category // Store parent CSV ID temporarily
      })
    }

    await Category.deleteMany({})
    
    // Insert categories first
    // Note: 'parentCsvId' will be ignored by Mongoose schema unless strict: false
    const insertedCategories = await Category.insertMany(docsWithParent)

    // Create a map of csvId -> _id
    const categoryMap = {}
    insertedCategories.forEach(cat => {
      if (cat.csvId) categoryMap[cat.csvId] = cat._id
    })

    let updatedCount = 0
    
    // Iterate through the original docs (which contain parentCsvId) to link parents
    for (const doc of docsWithParent) {
      if (doc.parentCsvId) {
        const childId = categoryMap[doc.csvId]
        const parentId = categoryMap[doc.parentCsvId]
        
        // Ensure both child and parent exist and are not the same (avoid self-reference loop if data is bad)
        if (childId && parentId && childId.toString() !== parentId.toString()) {
          await Category.updateOne({ _id: childId }, { parentId: parentId })
          updatedCount++
        }
      }
    }

    res.json({
      imported: insertedCategories.length,
      updatedParents: updatedCount
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router
