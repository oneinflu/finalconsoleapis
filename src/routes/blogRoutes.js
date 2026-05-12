const express = require("express");
const slugify = require("slugify");
const Blog = require("../models/Blog");
const BlogFaq = require("../models/BlogFaq");
const BlogSection = require("../models/BlogSection");

const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    const {
      title,
      h2,
      content,
      categoryId,
      image,
      keywords,
      excerpt,
      altTag,
      authorName,
      sections,
      faqs,
      metaTitle,
      headingTag,
      canonicalUrl,
      updatedDate,
      isActive,
      metaRobotsIndex,
      metaRobotsFollow,
    } = req.body;

    const slug = slugify(title, { lower: true, strict: true });

    let uniqueSlug = slug;
    let counter = 1;
    while (await Blog.findOne({ slug: uniqueSlug })) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

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
      status: "DRAFT",
      date: new Date(),
      faqs: [],
      sections: [],
      metaTitle: metaTitle || null,
      headingTag: headingTag || "h1",
      canonicalUrl: canonicalUrl || null,
      updatedDate: updatedDate ? new Date(updatedDate) : null,
      isActive: isActive !== undefined ? isActive : true,
      metaRobotsIndex: metaRobotsIndex || "index",
      metaRobotsFollow: metaRobotsFollow || "follow",
    });

    const savedBlog = await newBlog.save();

    if (sections && sections.length > 0) {
      const userId = req.user?._id || null;
      const sectionDocs = sections.map((sec) => ({
        section: sec.title,
        content: sec.content,
        cta: sec.cta ? "yes" : "no",
        createdBy: userId,
      }));
      const createdSections = await BlogSection.insertMany(sectionDocs);
      savedBlog.sections = createdSections.map((s) => s._id);
    }

    if (faqs && faqs.length > 0) {
      const faqDocs = faqs.map((f) => ({
        question: f.question,
        answer: f.answer,
      }));
      const createdFaqs = await BlogFaq.insertMany(faqDocs);
      savedBlog.faqs = createdFaqs.map((f) => f._id);
    }

    await savedBlog.save();

    res.status(201).json(savedBlog);
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { role, userId, title, categoryId, status, date } = req.query;

    let query = {};

    if (role === "Team Member" && userId) {
      query.author = userId;
    }

    if (title) {
      query.title = { $regex: title, $options: "i" };
    }

    if (categoryId) {
      query.categoryId = categoryId;
    }

    if (status) {
      query.status = status.toUpperCase();
    }

    if (date) {
      const start = new Date(date);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setUTCHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    const blogs = await Blog.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .populate("categoryId", "name")
      .select("title categoryId status date votes image approvedOn isActive")
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

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    let blog = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      blog = await Blog.findById(id)
        .populate("sections")
        .populate("faqs")
        .populate("categoryId", "name")
        .lean();
    }

    if (!blog) {
      blog = await Blog.findOne({ slug: id })
        .populate("sections")
        .populate("faqs")
        .populate("categoryId", "name")
        .lean();
    }

    if (!blog) {
      res.status(404).json({ error: "Blog not found" });
      return;
    }

    res.json(blog);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      h2,
      content,
      categoryId,
      image,
      keywords,
      excerpt,
      altTag,
      authorName,
      sections,
      faqs,
      status,
      metaTitle,
      headingTag,
      canonicalUrl,
      updatedDate,
      isActive,
      metaRobotsIndex,
      metaRobotsFollow,
    } = req.body;

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    blog.title = title;
    blog.h2 = h2;
    blog.initialContent = content;
    blog.categoryId = categoryId;
    blog.image = image;
    blog.keywords = keywords;
    blog.excerpt = excerpt;
    blog.altTag = altTag;
    blog.authorName = authorName;
    if (status) blog.status = status;

    if (metaTitle !== undefined) blog.metaTitle = metaTitle || null;
    if (headingTag !== undefined) blog.headingTag = headingTag;
    if (canonicalUrl !== undefined) blog.canonicalUrl = canonicalUrl || null;
    if (updatedDate !== undefined)
      blog.updatedDate = updatedDate ? new Date(updatedDate) : null;
    if (isActive !== undefined) blog.isActive = isActive;
    if (metaRobotsIndex !== undefined) blog.metaRobotsIndex = metaRobotsIndex;
    if (metaRobotsFollow !== undefined)
      blog.metaRobotsFollow = metaRobotsFollow;

    if (title && title !== blog.title) {
      const slug = slugify(title, { lower: true, strict: true });
      let uniqueSlug = slug;
      let counter = 1;
      while (await Blog.findOne({ slug: uniqueSlug, _id: { $ne: blog._id } })) {
        uniqueSlug = `${slug}-${counter}`;
        counter++;
      }
      blog.slug = uniqueSlug;
    }

    if (blog.sections && blog.sections.length > 0) {
      await BlogSection.deleteMany({ _id: { $in: blog.sections } });
    }

    let newSectionIds = [];
    if (sections && sections.length > 0) {
      const userId = req.user?._id || null;
      const sectionDocs = sections.map((sec) => ({
        section: sec.title,
        content: sec.content,
        cta: sec.cta ? "yes" : "no",
        createdBy: userId,
        updatedBy: userId,
      }));
      const createdSections = await BlogSection.insertMany(sectionDocs);
      newSectionIds = createdSections.map((s) => s._id);
    }
    blog.sections = newSectionIds;

    if (blog.faqs && blog.faqs.length > 0) {
      await BlogFaq.deleteMany({ _id: { $in: blog.faqs } });
    }

    let newFaqIds = [];
    if (faqs && faqs.length > 0) {
      const faqDocs = faqs.map((f) => ({
        question: f.question,
        answer: f.answer,
      }));
      const createdFaqs = await BlogFaq.insertMany(faqDocs);
      newFaqIds = createdFaqs.map((f) => f._id);
    }
    blog.faqs = newFaqIds;

    await blog.save();

    res.json(blog);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    if (blog.sections && blog.sections.length > 0) {
      await BlogSection.deleteMany({ _id: { $in: blog.sections } });
    }
    if (blog.faqs && blog.faqs.length > 0) {
      await BlogFaq.deleteMany({ _id: { $in: blog.faqs } });
    }

    await Blog.findByIdAndDelete(id);

    res.json({ message: "Blog deleted successfully" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
