const express = require("express")
const Blog = require("../models/Blog")
const SystemUser = require("../models/SystemUser")
const Category = require("../models/Category")

const router = express.Router()

// --- Dashboard Stats ---
router.get("/stats", async (req, res, next) => {
  try {
    const { role, userId } = req.query

    let blogQuery = {}
    if (role === "Team Member" && userId) {
      blogQuery.author = userId
    }

    const totalUsers = await SystemUser.countDocuments({})
    const totalBlogs = await Blog.countDocuments(blogQuery)
    
    // Active Blogs: status is "APPROVED"
    const activeBlogs = await Blog.countDocuments({ 
        ...blogQuery,
        status: "APPROVED"
    })
    
    // Categories Count from Category model
    const categoriesCount = await Category.countDocuments({})

    // Calculate recent trends (e.g., last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const newBlogsLast30Days = await Blog.countDocuments({ ...blogQuery, createdAt: { $gte: thirtyDaysAgo } })
    const newUsersLast30Days = await SystemUser.countDocuments({ createdAt: { $gte: thirtyDaysAgo } })

    res.json({
      totalUsers,
      totalBlogs,
      activeBlogs,
      categoriesCount,
      trends: {
        newBlogsLast30Days,
        newUsersLast30Days
      }
    })
  } catch (error) {
    next(error)
  }
})

// --- Recent Blogs ---
router.get("/recent-blogs", async (req, res, next) => {
  try {
    const { role, userId } = req.query
    const limit = parseInt(req.query.limit) || 5
    
    let query = {}
    if (role === "Team Member" && userId) {
      query.author = userId
    }

    const recentBlogs = await Blog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("title categoryId status createdAt date votes image approvedOn")
      .populate("categoryId", "name") // Populate category name
      .lean()

    res.json(recentBlogs)
  } catch (error) {
    next(error)
  }
})

module.exports = router
