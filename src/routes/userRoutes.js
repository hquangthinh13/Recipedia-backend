import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import optionalAuth from "../middleware/optionalAuth.js";
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
router.get("/:id/profile", optionalAuth, async (req, res) => {
  try {
    const viewerId = req.user?._id;
    const user = await User.findById(req.params.id)
      .select("name email avatar createdAt followersCount followingCount")
      .lean();

    if (!user) return res.status(404).json({ message: "User not found" });

    const recipes = await Recipe.find({ author: req.params.id })
      .populate("author likeCount", "name avatar")
      .sort({ createdAt: -1 })
      .lean();

    let isFollowing = false;
    if (viewerId && viewerId.toString() !== req.params.id) {
      const viewer = await User.findById(viewerId).select("following").lean();
      isFollowing = viewer?.following?.some(
        (f) => f.toString() === req.params.id
      );
    }

    res.json({ user, recipes, isFollowing });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @route   POST /api/users/:id/follow
 * @desc    Toggle follow/unfollow another user
 * @access  Private
 */
router.post("/:id/follow", authMiddleware, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user.id;

    if (targetUserId === currentUserId) {
      return res.status(400).json({ msg: "You cannot follow yourself." });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ msg: "User not found." });
    }

    // Check if already following
    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      // 🔻 Unfollow
      currentUser.following = currentUser.following.filter(
        (id) => id.toString() !== targetUserId
      );
      targetUser.followers = targetUser.followers.filter(
        (id) => id.toString() !== currentUserId
      );
      // Update counts
      currentUser.followingCount = Math.max(0, currentUser.following.length);
      targetUser.followersCount = Math.max(0, targetUser.followers.length);
      await currentUser.save();
      await targetUser.save();

      return res.json({
        msg: `✅ You unfollowed ${targetUser.name}.`,
        isFollowing: false,
        followersCount: targetUser.followersCount,
      });
    } else {
      // 🔺 Follow
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);
      // Update counts
      currentUser.followingCount = Math.max(0, currentUser.following.length);
      targetUser.followersCount = Math.max(0, targetUser.followers.length);
      await currentUser.save();
      await targetUser.save();

      return res.json({
        msg: `✅ You are now following ${targetUser.name}.`,
        isFollowing: true,
        followersCount: targetUser.followersCount,
      });
    }
  } catch (error) {
    console.error("Follow/Unfollow error:", error);
    res.status(500).json({ msg: "Server error toggling follow state." });
  }
});

/**
 * @route   GET /api/users/:id/followers
 * @desc    Get followers of a user
 * @access  Public
 */
router.get("/:id/followers", async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("followers", "name avatar followingCount followersCount")
      .select("name email avatar followersCount followingCount")
      .lean();

    if (!user) return res.status(404).json({ msg: "User not found." });

    res.json({ followers: user.followers });
  } catch (error) {
    console.error("Fetch followers error:", error);
    res.status(500).json({ msg: "Server error fetching followers." });
  }
});

/**
 * @route   GET /api/users/:id/following
 * @desc    Get users that a user is following
 * @access  Public
 */
router.get("/:id/following", async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("following", "name avatar followingCount followersCount")
      .select("name email avatar followingCount followersCount")
      .lean();

    if (!user) return res.status(404).json({ msg: "User not found." });

    res.json({ following: user.following });
  } catch (error) {
    console.error("Fetch following error:", error);
    res.status(500).json({ msg: "Server error fetching following list." });
  }
});
export default router;
