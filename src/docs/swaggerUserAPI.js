/**
 * @swagger
 * /api/users/avatar:
 *   post:
 *     summary: Update the authenticated user's avatar
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [avatarUrl]
 *             properties:
 *               avatarUrl:
 *                 type: string
 *                 format: uri
 *                 example: "https://cdn.recipedia.com/avatars/huynh_quang_thinh.jpg"
 *     responses:
 *       200:
 *         description: Avatar updated successfully
 *       400:
 *         description: Invalid or missing avatar URL
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 *
 * /api/users/{id}/profile:
 *   get:
 *     summary: Get a user's public profile, recipes, favorites, and follow status
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "68f8d3e3279ffb6794d6dfd3"
 *     responses:
 *       200:
 *         description: User profile retrieved
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 *
 * /api/users/top:
 *   get:
 *     summary: Get top users leaderboard based on engagement score
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Leaderboard retrieved
 *       500:
 *         description: Server error
 *
 * /api/users/{id}/follow:
 *   post:
 *     summary: Follow or unfollow a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "68fb8861bc0250763766965c"
 *     responses:
 *       200:
 *         description: Follow state toggled
 *       400:
 *         description: Cannot follow self
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 *
 * /api/users/{id}/followers:
 *   get:
 *     summary: Get a user's followers list
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Followers retrieved
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 *
 * /api/users/{id}/following:
 *   get:
 *     summary: Get users that this user is following
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Following list retrieved
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 *
 * /api/users/notifications:
 *   get:
 *     summary: Get all notifications for authenticated user (paginated)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Notifications list
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 *
 * /api/users/notifications/mark-all-read:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 *
 * /api/users/{id}/interactions-summary:
 *   get:
 *     summary: Get day-by-day likes & comments summary for a user's recipes
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: range
 *         schema:
 *           type: string
 *           enum: ["7", "30"]
 *         example: "7"
 *     responses:
 *       200:
 *         description: Interaction summary retrieved
 *       404:
 *         description: User or recipes not found
 *       500:
 *         description: Server error
 */
