const express = require("express")
const Role = require("../models/Role")
const Permission = require("../models/Permission")
const SystemUser = require("../models/SystemUser")

const router = express.Router()

// --- Roles ---
router.get("/roles", async (req, res, next) => {
  try {
    const roles = await Role.find({}).sort({ createdAt: -1 })
    res.json(roles)
  } catch (error) {
    next(error)
  }
})

// --- Permissions ---
router.get("/permissions", async (req, res, next) => {
  try {
    const permissions = await Permission.find({}).sort({ createdAt: -1 })
    res.json(permissions)
  } catch (error) {
    next(error)
  }
})

// --- System Users ---
router.get("/users", async (req, res, next) => {
  try {
    const users = await SystemUser.find({})
      .populate("roleId", "roleName")
      .sort({ createdAt: -1 })
    res.json(users)
  } catch (error) {
    next(error)
  }
})

module.exports = router
