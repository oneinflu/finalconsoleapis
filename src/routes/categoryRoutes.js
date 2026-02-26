const express = require("express")
const Category = require("../models/Category")
const router = express.Router()

// GET /categories
router.get("/", async (req, res, next) => {
  try {
    const categories = await Category.find({})
      .populate("parentId", "name")
      .sort({ createdAt: -1 })
    res.json(categories)
  } catch (error) {
    next(error)
  }
})

// POST /categories
router.post("/", async (req, res, next) => {
  try {
    const { name, parentId } = req.body
    const category = new Category({ name, parentId: parentId || null })
    await category.save()
    res.status(201).json(category)
  } catch (error) {
    next(error)
  }
})

// PUT /categories/:id
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params
    const { name, parentId } = req.body
    
    const category = await Category.findByIdAndUpdate(
      id,
      { name, parentId: parentId || null },
      { new: true }
    ).populate("parentId", "name")

    if (!category) {
      return res.status(404).json({ error: "Category not found" })
    }

    res.json(category)
  } catch (error) {
    next(error)
  }
})

// DELETE /categories/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params
    const category = await Category.findByIdAndDelete(id)
    
    if (!category) {
      return res.status(404).json({ error: "Category not found" })
    }

    res.json({ message: "Category deleted successfully" })
  } catch (error) {
    next(error)
  }
})

module.exports = router