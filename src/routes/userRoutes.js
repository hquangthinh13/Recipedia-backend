import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import optionalAuth from "../middleware/optionalAuth.js";
import User from "../models/User.js";
import Recipe from "../models/Recipe.js";
import Notification from "../models/Notification.js";
const router = express.Router();

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
      msg: "Avatar updated successfully.",
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

    // Fetch user basic info + favorite recipes list
    const user = await User.findById(req.params.id)
      .select(
        "name email avatar createdAt followersCount followingCount favorites"
      )
      .populate({
        path: "favorites",
        select:
          "title coverImage cookingTime dishType likeCount createdAt author ingredients instructions",
        options: { sort: { createdAt: -1 } },
        populate: { path: "author", select: "name avatar" },
      })
      .lean();

    if (!user) return res.status(404).json({ message: "User not found" });

    // Fetch user's own created recipes
    const recipes = await Recipe.find({ author: req.params.id })
      .populate("author", "name avatar")
      .sort({ createdAt: -1 })
      .lean();

    // Determine if the viewer follows this user
    let isFollowing = false;
    if (viewerId && viewerId.toString() !== req.params.id) {
      const viewer = await User.findById(viewerId).select("following").lean();
      isFollowing = viewer?.following?.some(
        (f) => f.toString() === req.params.id
      );
    }

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt,
        followersCount: user.followersCount,
        followingCount: user.followingCount,
      },
      recipes,
      favorites: user.favorites || [],
      favoritesCount: user.favorites?.length || 0,
      isFollowing,
    });
  } catch (err) {
    console.error("Error fetching user profile:", err);
    res.status(500).json({ message: err.message });
  }
});

router.get("/top", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Fetch all users
    const users = await User.find()
      .select("name avatar followersCount createdAt")
      .lean();

    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        const recipes = await Recipe.find({ author: user._id }).select(
          "likeCount commentCount"
        );

        const totalLikes = recipes.reduce(
          (sum, r) => sum + (r.likeCount || 0),
          0
        );
        const totalComments = recipes.reduce(
          (sum, r) => sum + (r.commentCount || 0),
          0
        );
        const totalRecipes = recipes.length;

        const totalPoints =
          totalLikes * 1 +
          totalComments * 1 +
          user.followersCount * 2 +
          totalRecipes * 3;

        return {
          _id: user._id,
          name: user.name,
          avatar: user.avatar,
          followersCount: user.followersCount,
          createdAt: user.createdAt,
          totalLikes,
          totalComments,
          totalRecipes,
          totalPoints,
        };
      })
    );

    // Sort users by totalPoints (descending)
    const sorted = enrichedUsers.sort((a, b) => b.totalPoints - a.totalPoints);

    // Assign rank based on position
    const ranked = sorted.map((user, index) => ({
      ...user,
      rank: index + 1,
    }));

    // Return top N
    res.json({ topUsers: ranked.slice(0, limit) });
  } catch (error) {
    console.error("Error fetching top users:", error);
    res.status(500).json({ message: "Server error fetching top users" });
  }
});

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
      // Unfollow
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
        msg: `You unfollowed ${targetUser.name}.`,
        isFollowing: false,
        followersCount: targetUser.followersCount,
      });
    } else {
      // Follow
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);
      // Update counts
      currentUser.followingCount = Math.max(0, currentUser.following.length);
      targetUser.followersCount = Math.max(0, targetUser.followers.length);
      await currentUser.save();
      await targetUser.save();
      // create follow notification
      await Notification.create({
        recipient: targetUserId,
        sender: currentUserId,
        type: "follow",
      });
      return res.json({
        msg: `You are now following ${targetUser.name}.`,
        isFollowing: true,
        followersCount: targetUser.followersCount,
      });
    }
  } catch (error) {
    console.error("Follow/Unfollow error:", error);
    res.status(500).json({ msg: "Server error toggling follow state." });
  }
});

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

// Get notifications with pagination
router.get("/notifications", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    // Pagination (same pattern as recipes)
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ recipient: userId })
      .populate("sender recipe parentRecipe")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: error.message });
  }
});

router.patch(
  "/notifications/mark-all-read",
  authMiddleware,
  async (req, res) => {
    const userId = req.user._id || req.user.id; // same fix
    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true }
    );
    res.json({ ok: true });
  }
);

router.get("/:id/interactions-summary", async (req, res) => {
  try {
    const userId = req.params.id;
    const { range } = req.query;

    // Date filter
    let startDate = null;
    if (range === "7") {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    } else if (range === "30") {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
    }

    // Get all recipes authored by the user
    const recipes = await Recipe.find({ author: userId }).select("_id");
    if (!recipes.length) return res.json({ data: [] });

    const recipeIds = recipes.map((r) => r._id);

    // Match notifications for these recipes
    const matchStage = {
      recipe: { $in: recipeIds },
      type: { $in: ["like", "comment"] },
    };
    if (startDate) matchStage.createdAt = { $gte: startDate };

    const results = await Notification.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            type: "$type",
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.date",
          likes: {
            $sum: { $cond: [{ $eq: ["$_id.type", "like"] }, "$count", 0] },
          },
          comments: {
            $sum: { $cond: [{ $eq: ["$_id.type", "comment"] }, "$count", 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Format for frontend
    const data = results.map((r) => ({
      date: r._id,
      likes: r.likes,
      comments: r.comments,
    }));

    res.json({ data });
  } catch (err) {
    console.error("Error fetching interaction summary:", err);
    res.status(500).json({ message: "Server error fetching summary" });
  }
});

export default router;
