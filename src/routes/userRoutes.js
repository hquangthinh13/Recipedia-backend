import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import optionalAuth from "../middleware/optionalAuth.js";

import {
  updateAvatar,
  getUserProfile,
  getTopUsers,
  toggleFollowUser,
  getFollowers,
  getFollowing,
  getNotifications,
  markAllNotificationsRead,
  getInteractionsSummary,
} from "../controllers/userController.js";

const router = express.Router();

router.post("/avatar", authMiddleware, updateAvatar);

router.get("/:id/profile", optionalAuth, getUserProfile);

router.get("/top", getTopUsers);

router.post("/:id/follow", authMiddleware, toggleFollowUser);

router.get("/:id/followers", getFollowers);
router.get("/:id/following", getFollowing);

router.get("/notifications", authMiddleware, getNotifications);
router.patch(
  "/notifications/mark-all-read",
  authMiddleware,
  markAllNotificationsRead
);

router.get("/:id/interactions-summary", getInteractionsSummary);

export default router;
