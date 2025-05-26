import express from "express";
import { auth } from "../middleware/auth.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

// Get all users
router.get("/users", auth, adminMiddleware, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "username", "email", "isAdmin", "createdAt"],
    });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
});

// Delete user
router.delete("/users/:userId", auth, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await user.destroy();
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Error deleting user" });
  }
});

// Update user role
router.put("/users/:userId/role", auth, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await user.update({ isAdmin: req.body.isAdmin });
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ message: "Error updating user role" });
  }
});

export default router;
