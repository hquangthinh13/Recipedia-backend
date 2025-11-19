/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Start signup and send verification code
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Verification code sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Verification code sent. Please check your inbox."
 *       400:
 *         description: User already exists
 *       500:
 *         description: Server error
 *     example:
 *       name: "Huynh Quang Thinh"
 *       email: "22521407@gm.uit.edu.vn"
 *       password: "uit2025"
 */

/**
 * @swagger
 * /api/auth/verify-code:
 *   post:
 *     summary: Verify email using 6-digit code and create new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified & user created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: "#/components/schemas/User"
 *       400:
 *         description: Invalid or expired code
 *       500:
 *         description: Server error
 *     example:
 *       email: "22521407@gm.uit.edu.vn"
 *       code: "123456"
 */

/**
 * @swagger
 * /api/auth/resend-code:
 *   post:
 *     summary: Resend a new email verification code
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: New verification code sent
 *       400:
 *         description: No pending signup found
 *     example:
 *       email: "22521407@gm.uit.edu.vn"
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email & password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful, JWT returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       400:
 *         description: User does not exist or invalid password
 *       401:
 *         description: Email not verified
 *       500:
 *         description: Server error
 *     example:
 *       email: "22521407@gm.uit.edu.vn"
 *       password: "uit2025"
 */

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User data retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 avatar:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                 favorites:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/auth/request-password-reset:
 *   post:
 *     summary: Request a password reset code
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset code sent
 *       404:
 *         description: No account found
 *       500:
 *         description: Server error
 *     example:
 *       email: "22521407@gm.uit.edu.vn"
 */

/**
 * @swagger
 * /api/auth/verify-reset-code:
 *   post:
 *     summary: Verify the 6-digit password-reset code
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code]
 *             properties:
 *               email:
 *                 type: string
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Code verified
 *       400:
 *         description: Invalid or expired code
 *     example:
 *       email: "22521407@gm.uit.edu.vn"
 *       code: "123456"
 */

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset the user's password after verifying reset code
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, newPassword]
 *             properties:
 *               email:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Reset code not verified
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 *     example:
 *       email: "22521407@gm.uit.edu.vn"
 *       newPassword: "uit2025"
 */
