require("dotenv").config()
const mongoose = require("mongoose")

const WebPage = require("../src/models/WebPage")
const Category = require("../src/models/Category")
const Location = require("../src/models/Location")

const slugify = (text) => {
  if (!text) return ""
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI)
  console.log("Connected to MongoDB")

  const pages = await WebPage.find({})
    .populate("categoryId", "name slug")
    .populate("locationId", "name")
    .lean()

  console.log(`Found ${pages.length} web pages to update`)

  let updated = 0
  let skipped = 0
  let errors = 0

  for (const page of pages) {
    const categorySlug = page.categoryId?.slug || slugify(page.categoryId?.name || "")
    const locationSlug = slugify(page.locationId?.name || "")

    if (!categorySlug || !locationSlug) {
      console.warn(`Skipping page ${page._id} — missing category or location`)
      skipped++
      continue
    }

    const newSlug = `best-${categorySlug}-coaching-in-${locationSlug}`

    if (page.slug === newSlug) {
      skipped++
      continue
    }

    try {
      await WebPage.updateOne({ _id: page._id }, { slug: newSlug })
      console.log(`  ${page.slug}  →  ${newSlug}`)
      updated++
    } catch (err) {
      console.error(`Error updating ${page._id}: ${err.message}`)
      errors++
    }
  }

  console.log(`\nDone. Updated: ${updated}, Already correct: ${skipped}, Errors: ${errors}`)
  await mongoose.disconnect()
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
