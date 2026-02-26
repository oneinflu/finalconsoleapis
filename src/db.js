const mongoose = require("mongoose")

const connectToDatabase = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/blog_migration"
  await mongoose.connect(uri, {
    autoIndex: true
  })
}

module.exports = {
  connectToDatabase
}
