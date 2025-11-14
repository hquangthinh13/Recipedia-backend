import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import optionalAuth from "../middleware/optionalAuth.js";
import User from "../models/User.js";
import Recipe from "../models/Recipe.js";
import Notification from "../models/Notification.js";
const router = express.Router();
/**
 * @swagger
 * /api/users/avatar:
 *   post:
 *     summary: Update the authenticated user's avatar
 *     tags: [Users]
 *     description: >
 *       Updates the logged-in user's avatar image URL.
 *       This endpoint requires authentication via JWT (`Authorization: Bearer <token>`).
 *       The provided `avatarUrl` must be a valid image URL.
 *     security:
 *       - bearerAuth: []   # Requires JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - avatarUrl
 *             properties:
 *               avatarUrl:
 *                 type: string
 *                 format: uri
 *                 description: The new avatar image URL for the user
 *                 example: "https://cdn.recipedia.com/avatars/john_doe.jpg"
 *     responses:
 *       200:
 *         description: Avatar updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Avatar updated successfully."
 *                 avatar:
 *                   type: string
 *                   example: "https://cdn.recipedia.com/avatars/john_doe.jpg"
 *       400:
 *         description: Invalid or missing avatar URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Invalid or missing avatar URL."
 *       401:
 *         description: Unauthorized — missing or invalid JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "No token, authorization denied"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "User not found."
 *       500:
 *         description: Server error while updating avatar
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Server error updating avatar."
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
      msg: "Avatar updated successfully.",
      avatar: user.avatar,
    });
  } catch (error) {
    console.error("Error updating avatar:", error);
    res.status(500).json({ msg: "Server error updating avatar." });
  }
});
/**
 * @swagger
 * /api/users/{id}/profile:
 *   get:
 *     summary: Get a user's public profile, favorites, and recipes
 *     tags: [Users]
 *     description: >
 *       Retrieves a user's profile information, including their basic details, followers/following counts,
 *       their created recipes, and list of favorite recipes.
 *       Authentication is optional — if a logged-in user views another profile,
 *       the response also includes whether the viewer follows that user (`isFollowing`).
 *     security:
 *       - bearerAuth: []   # Optional authentication (works with or without token)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique ID of the user whose profile to fetch
 *         example: 68fb8861bc0250763766965c
 *     responses:
 *       200:
 *         description: Successfully retrieved user profile and related data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "68fb8861bc0250763766965c"
 *                     name:
 *                       type: string
 *                       example: "Jane Doe"
 *                     email:
 *                       type: string
 *                       example: "jane@example.com"
 *                     avatar:
 *                       type: string
 *                       example: "https://cdn.recipedia.com/avatars/jane_doe.jpg"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-01-15T12:30:00.000Z"
 *                     followersCount:
 *                       type: integer
 *                       example: 120
 *                     followingCount:
 *                       type: integer
 *                       example: 58
 *                 recipes:
 *                   type: array
 *                   description: List of recipes created by the user
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "64fabcd1234e56789abc"
 *                       title:
 *                         type: string
 *                         example: "Spaghetti Carbonara"
 *                       coverImage:
 *                         type: string
 *                         example: "https://cdn.recipedia.com/recipes/carbonara.jpg"
 *                       cookingTime:
 *                         type: string
 *                         example: "medium"
 *                       dishType:
 *                         type: string
 *                         example: "main"
 *                       likeCount:
 *                         type: integer
 *                         example: 42
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-02-03T09:00:00.000Z"
 *                       author:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: "Jane Doe"
 *                           avatar:
 *                             type: string
 *                             example: "https://cdn.recipedia.com/avatars/jane_doe.jpg"
 *                 favorites:
 *                   type: array
 *                   description: List of recipes the user has favorited
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "64f1234567abcde89012"
 *                       title:
 *                         type: string
 *                         example: "Mango Smoothie"
 *                       coverImage:
 *                         type: string
 *                         example: "https://cdn.recipedia.com/recipes/mango_smoothie.jpg"
 *                       author:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: "Alice Nguyen"
 *                           avatar:
 *                             type: string
 *                             example: "https://cdn.recipedia.com/avatars/alice.png"
 *                 favoritesCount:
 *                   type: integer
 *                   example: 5
 *                 isFollowing:
 *                   type: boolean
 *                   description: Whether the logged-in user follows this profile
 *                   example: true
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User not found"
 *       500:
 *         description: Server error while fetching user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server error"
 */

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

/**
 * @swagger
 * /api/users/top:
 *   get:
 *     summary: Get the top users leaderboard
 *     tags: [Users]
 *     description: >
 *       Retrieves the top users based on their total engagement score, which is calculated using the following formula:
 *       **totalPoints = (likes × 1) + (comments × 1) + (followers × 2) + (recipes × 3)**
 *       Returns a ranked list of users sorted by totalPoints in descending order.
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: The maximum number of top users to return
 *         example: 10
 *     responses:
 *       200:
 *         description: Successfully retrieved leaderboard of top users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 topUsers:
 *                   type: array
 *                   description: List of ranked top users
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "68fb8861bc0250763766965c"
 *                       name:
 *                         type: string
 *                         example: "Jane Doe"
 *                       avatar:
 *                         type: string
 *                         example: "https://cdn.recipedia.com/avatars/jane_doe.jpg"
 *                       followersCount:
 *                         type: integer
 *                         example: 120
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-01-15T10:45:00.000Z"
 *                       totalLikes:
 *                         type: integer
 *                         example: 300
 *                       totalComments:
 *                         type: integer
 *                         example: 120
 *                       totalRecipes:
 *                         type: integer
 *                         example: 25
 *                       totalPoints:
 *                         type: integer
 *                         example: 670
 *                       rank:
 *                         type: integer
 *                         description: Rank position based on total points
 *                         example: 1
 *       500:
 *         description: Server error while computing top users leaderboard
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server error fetching top users"
 */

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

/**
 * @swagger
 * /api/users/{id}/follow:
 *   post:
 *     summary: Follow or unfollow another user
 *     tags: [Users]
 *     description: >
 *       Toggles the follow status between the authenticated user and the target user.
 *       - If the user is not following the target, this endpoint will **follow** them.
 *       - If the user is already following, it will **unfollow**.
 *       Also updates each user’s follower and following counts, and sends a notification to the target user when followed.
 *     security:
 *       - bearerAuth: []   # Requires JWT token
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to follow or unfollow
 *         example: 68fb8861bc0250763766965c
 *     responses:
 *       200:
 *         description: Follow state toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "You are now following Jane Doe."
 *                 isFollowing:
 *                   type: boolean
 *                   description: Whether the current user now follows the target user
 *                   example: true
 *                 followersCount:
 *                   type: integer
 *                   description: Updated number of followers for the target user
 *                   example: 123
 *       400:
 *         description: Invalid request (e.g., trying to follow self)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "You cannot follow yourself."
 *       401:
 *         description: Unauthorized — missing or invalid JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "No token, authorization denied"
 *       404:
 *         description: One or both users not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "User not found."
 *       500:
 *         description: Server error while toggling follow state
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Server error toggling follow state."
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
/**
 * @swagger
 * /api/users/{id}/followers:
 *   get:
 *     summary: Get a user's followers
 *     tags: [Users]
 *     description: >
 *       Retrieves the list of users who are following the specified user.
 *       Returns basic follower information such as name, avatar, and follower/following counts.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user whose followers are being requested
 *         example: 68fb8861bc0250763766965c
 *     responses:
 *       200:
 *         description: Successfully retrieved list of followers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 followers:
 *                   type: array
 *                   description: List of followers for the specified user
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "64f9876543abcde21098"
 *                       name:
 *                         type: string
 *                         example: "John Doe"
 *                       avatar:
 *                         type: string
 *                         example: "https://cdn.recipedia.com/avatars/john_doe.jpg"
 *                       followingCount:
 *                         type: integer
 *                         example: 87
 *                       followersCount:
 *                         type: integer
 *                         example: 112
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "User not found."
 *       500:
 *         description: Server error while fetching followers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Server error fetching followers."
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
 * @swagger
 * /api/users/{id}/following:
 *   get:
 *     summary: Get a user's following list
 *     tags: [Users]
 *     description: >
 *       Retrieves the list of users that the specified user is following.
 *       Each entry includes basic information about the followed users such as name, avatar, and their follower/following counts.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user whose following list is being requested
 *         example: 68fb8861bc0250763766965c
 *     responses:
 *       200:
 *         description: Successfully retrieved following list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 following:
 *                   type: array
 *                   description: List of users the specified user is following
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "64f9876543abcde21098"
 *                       name:
 *                         type: string
 *                         example: "Jane Doe"
 *                       avatar:
 *                         type: string
 *                         example: "https://cdn.recipedia.com/avatars/jane_doe.jpg"
 *                       followingCount:
 *                         type: integer
 *                         example: 45
 *                       followersCount:
 *                         type: integer
 *                         example: 150
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "User not found."
 *       500:
 *         description: Server error while fetching following list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Server error fetching following list."
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
/**
 * @swagger
 * /api/users/notifications:
 *   get:
 *     summary: Get all notifications for the authenticated user (paginated)
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of notifications per page (max 100)
 *     responses:
 *       200:
 *         description: List of notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   type:
 *                     type: string
 *                     example: "like"
 *                   sender:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       avatar:
 *                         type: string
 *                   recipe:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       coverImage:
 *                         type: string
 *                   isRead:
 *                     type: boolean
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       500:
 *         description: Internal server error
 */

// Get notifications with pagination
router.get("/notifications", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    // Pagination (same pattern as recipes)
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ recipient: userId })
      .populate("sender recipe")
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

/**
 * @swagger
 * /api/users/notifications/mark-all-read:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     description: >
 *       Marks all unread notifications for the authenticated user as read.
 *       This operation updates all notifications where `isRead` is `false` to `true`.
 *     security:
 *       - bearerAuth: []   # Requires JWT token
 *     responses:
 *       200:
 *         description: All unread notifications marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Unauthorized — missing or invalid JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "No token, authorization denied"
 *       500:
 *         description: Server error while marking notifications as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Server error marking notifications as read"
 */
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
/**
 * @swagger
 * /api/users/{id}/interactions-summary:
 *   get:
 *     summary: Get a user's recipe interaction summary (likes and comments)
 *     tags: [Users]
 *     description: >
 *       Returns a day-by-day summary of **likes** and **comments** received on a user's recipes.
 *       The range can be filtered by the last 7 or 30 days using the `range` query parameter.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user whose interaction summary to retrieve
 *         example: 68fb8861bc0250763766965c
 *       - in: query
 *         name: range
 *         required: false
 *         schema:
 *           type: string
 *           enum: ["7", "30"]
 *         description: >
 *           Time range (in days) for which to fetch data.
 *           - `"7"` → last 7 days
 *           - `"30"` → last 30 days
 *           If omitted, returns all-time data.
 *         example: "7"
 *     responses:
 *       200:
 *         description: Successfully retrieved interaction summary data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   description: List of daily like and comment counts
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                         example: "2025-02-05"
 *                       likes:
 *                         type: integer
 *                         example: 15
 *                       comments:
 *                         type: integer
 *                         example: 8
 *       404:
 *         description: User or recipes not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User not found"
 *       500:
 *         description: Server error while fetching interaction summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server error fetching summary"
 */

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
