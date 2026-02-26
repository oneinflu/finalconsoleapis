const path = require("path")
const express = require("express")
const cors = require("cors")
const dotenv = require("dotenv")
const { connectToDatabase } = require("./db")
const importRoutes = require("./routes/importRoutes")
const blogRoutes = require("./routes/blogRoutes")
const authRoutes = require("./routes/authRoutes")
const teamRoutes = require("./routes/teamRoutes")
const dashboardRoutes = require("./routes/dashboardRoutes")
const categoryRoutes = require("./routes/categoryRoutes")
const uploadRoutes = require("./routes/uploadRoutes")
const publicRoutes = require("./routes/publicRoutes")

dotenv.config({
  path: path.resolve(process.cwd(), ".env")
})

const app = express()

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}))
app.use(express.json())

app.use("/import", importRoutes)
app.use("/blogs", blogRoutes)
app.use("/auth", authRoutes)
app.use("/team", teamRoutes)
app.use("/dashboard", dashboardRoutes)
app.use("/categories", categoryRoutes)
app.use("/upload", uploadRoutes)
app.use("/public", publicRoutes)

app.use((err, req, res, next) => {
  const status = err.status || 500
  res.status(status).json({
    error: err.message || "Internal server error"
  })
})

const port = process.env.PORT || 3000

connectToDatabase()
  .then(() => {
    app.listen(port, () => {
      process.stdout.write(`Server listening on port ${port}\n`)
    })
  })
  .catch(error => {
    process.stderr.write(`Failed to connect to database: ${error.message}\n`)
    process.exitCode = 1
  })

module.exports = app
