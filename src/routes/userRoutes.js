import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import Recipe from "../models/Recipe.js";

const router = express.Router();

/**
 * @route   POST /api/user/avatar
 * @desc    Update the user's avatar URL
 * @access  Private (requires valid JWT)
 */
router.post("/avatar", authMiddleware, async (req, res) => {
  try {
    const { avatarUrl } = req.body;

    // Validate
    if (!avatarUrl || typeof avatarUrl !== "string") {
      return res.status(400).json({ msg: "Invalid or missing avatar URL." });
    }

    // Find user by ID (from JWT payload)
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found." });

    // Update avatar field
    user.avatar = avatarUrl;
    await user.save();

    res.json({
      msg: "✅ Avatar updated successfully.",
      avatar: user.avatar,
    });
  } catch (error) {
    console.error("Error updating avatar:", error);
    res.status(500).json({ msg: "Server error updating avatar." });
  }
});

// GET /api/users/:id/profile
router.get("/:id/profile", async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("name email avatar createdAt")
      .lean();

    if (!user) return res.status(404).json({ message: "User not found" });

    const recipes = await Recipe.find({ author: req.params.id })
      .populate("author likeCount", "name avatar")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ user, recipes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
