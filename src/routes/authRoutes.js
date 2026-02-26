const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const SystemUser = require("../models/SystemUser")

const router = express.Router()

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body

    // 1. Find user by email
    const user = await SystemUser.findOne({ email }).populate("roleId")
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    // 2. Compare password (bcrypt)
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    // 3. Create JWT payload
    const payload = {
      userId: user._id,
      email: user.email,
      role: user.roleId ? user.roleId.roleName : null
    }

    // 4. Sign token
    const secret = process.env.JWT_SECRET || "default_secret_key_change_me"
    const token = jwt.sign(payload, secret, { expiresIn: "1d" })

    // 5. Return token and user info
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: payload.role
      }
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router
