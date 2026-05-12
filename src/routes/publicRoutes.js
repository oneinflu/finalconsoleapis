const express = require("express");
const Blog = require("../models/Blog");

const router = express.Router();

router.get("/blogs", async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { status: "APPROVED", isActive: true };

    const blogs = await Blog.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .populate("categoryId", "name")
      .select("-sections -faqs")
      .lean();

    const total = await Blog.countDocuments(query);

    res.json({
      data: blogs,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/blogs/:slug", async (req, res, next) => {
  try {
    const { slug } = req.params;

    const blog = await Blog.findOne({
      slug,
      status: "APPROVED",
      isActive: true,
    })
      .populate("sections")
      .populate("faqs")
      .populate("categoryId", "name")
      .lean();

    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    res.json(blog);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
