const mongoose = require("mongoose")

const connectToDatabase = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/blog_migration"
  await mongoose.connect(uri, {
    autoIndex: true
  })
  
  // Clean up stale indexes if they exist
  try {
    const db = mongoose.connection.db
    await db.collection("locations").dropIndex("normalizedName_1")
    process.stdout.write("Stale index normalizedName_1 dropped successfully\n")
  } catch (err) {
    // Ignore if index doesn't exist
  }
}

module.exports = {
  connectToDatabase
}
