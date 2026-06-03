const express = require("express")
const Location = require("../models/Location")
const WebPage = require("../models/WebPage")
const router = express.Router()

// GET /locations
router.get("/", async (req, res, next) => {
  try {
    const { type, parentId } = req.query
    const query = {}
    if (type) query.type = type
    if (parentId) query.parentId = parentId
    const locations = await Location.find(query).populate("parentId", "name type").sort({ createdAt: -1 })
    res.json(locations)
  } catch (error) {
    next(error)
  }
})

// POST /locations
// Supports creating a single location or an array of locations
router.post("/", async (req, res, next) => {
  try {
    const data = req.body
    if (Array.isArray(data)) {
      const filtered = data.filter(loc => loc.name && loc.name.trim() !== "")
      if (filtered.length === 0) {
        return res.status(400).json({ error: "No valid location names provided" })
      }
      const locations = await Location.insertMany(filtered)
      return res.status(201).json(locations)
    } else {
      const { name, type, parentId } = data
      if (!name || name.trim() === "") {
        return res.status(400).json({ error: "Name is required" })
      }
      const location = new Location({ name, type, parentId: parentId || null })
      await location.save()
      return res.status(201).json(location)
    }
  } catch (error) {
    next(error)
  }
})

// PUT /locations/:id
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params
    const { name, type, parentId } = req.body
    
    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Name is required" })
    }

    const location = await Location.findByIdAndUpdate(
      id,
      { name, type, parentId: parentId || null },
      { new: true, runValidators: true }
    )

    if (!location) {
      return res.status(404).json({ error: "Location not found" })
    }

    res.json(location)
  } catch (error) {
    next(error)
  }
})

// GET /locations/export
router.get("/export", async (req, res, next) => {
  try {
    const { stringify } = require("csv-stringify/sync")
    const locations = await Location.find({}).sort({ name: 1 })
    const data = locations.map(loc => ({
      name: loc.name,
      type: loc.type || "city"
    }))

    const csv = stringify(data, {
      header: true,
      columns: ["name", "type"]
    })

    res.setHeader("Content-Type", "text/csv")
    res.setHeader("Content-Disposition", "attachment; filename=locations.csv")
    res.status(200).send(csv)
  } catch (error) {
    next(error)
  }
})

// DELETE /locations/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params
    const location = await Location.findByIdAndDelete(id)
    
    if (!location) {
      return res.status(404).json({ error: "Location not found" })
    }

    // Cascade delete associated web pages
    await WebPage.deleteMany({ locationId: id })

    res.json({ message: "Location and all associated web pages deleted successfully" })
  } catch (error) {
    next(error)
  }
})

module.exports = router
