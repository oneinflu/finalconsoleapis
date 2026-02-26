const express = require("express")
const multer = require("multer")
const cloudinary = require("cloudinary").v2
require("dotenv").config() // Ensure dotenv is loaded
const router = express.Router()

// Configure Multer for memory storage
const upload = multer({ storage: multer.memoryStorage() })

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

// POST /upload
router.post("/", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" })
    }

    // Upload to Cloudinary using buffer
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "blog-migration/uploads",
          resource_type: "auto"
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )
      uploadStream.end(req.file.buffer)
    })

    res.json({ url: result.secure_url, public_id: result.public_id })
  } catch (error) {
    console.error("Upload failed:", error)
    next(error)
  }
})

module.exports = router