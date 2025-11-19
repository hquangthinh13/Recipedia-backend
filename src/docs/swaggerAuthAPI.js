/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *           example:
 *             email: "hquangthinh13@gmail.com"
 *             password: "thinh1234"
 *     responses:
 *       200:
 *         description: Login successful, returns JWT
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       400:
 *         description: User does not exist or invalid credentials
 *       401:
 *         description: Email not verified
 *       500:
 *         description: Server error
 *
 * /api/auth/me:
 *   get:
 *     summary: Get currently authenticated user's profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
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
 *                   format: date-time
 *                 favorites:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 *
 * /api/auth/signup:
 *   post:
 *     summary: Start signup and send a 6-digit email verification code
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *           example:
 *             name: "Huynh Quang Thinh"
 *             email: "22521407@gm.uit.edu.vn"
 *             password: "uit2025"
 *     responses:
 *       200:
 *         description: Verification code sent successfully
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
 *
 * /api/auth/verify-code:
 *   post:
 *     summary: Verify the 6-digit code and create the account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               code:
 *                 type: string
 *                 description: 6-digit verification code
 *           example:
 *             email: "22521407@gm.uit.edu.vn"
 *             code: "123456"
 *     responses:
 *       200:
 *         description: Email verified and account created, returns JWT and user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Email verified and account created successfully!"
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     avatar:
 *                       type: string
 *       400:
 *         description: No pending verification, expired code, or invalid code
 *       500:
 *         description: Server error
 *
 * /api/auth/resend-code:
 *   post:
 *     summary: Resend a new 6-digit verification code for signup
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *           example:
 *             email: "22521407@gm.uit.edu.vn"
 *     responses:
 *       200:
 *         description: New verification code sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "A new verification code has been sent to your email."
 *       400:
 *         description: No pending signup found
 *       500:
 *         description: Server error
 *
 *
 * /api/auth/request-password-reset:
 *   post:
 *     summary: Request a 6-digit password reset code by email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *           example:
 *             email: "22521407@gm.uit.edu.vn"
 *     responses:
 *       200:
 *         description: Password reset code sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Password reset code sent to your email."
 *       404:
 *         description: No account found with this email
 *       500:
 *         description: Server error
 *
 * /api/auth/verify-reset-code:
 *   post:
 *     summary: Verify the password reset 6-digit code
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               code:
 *                 type: string
 *                 description: 6-digit reset code
 *           example:
 *             email: "22521407@gm.uit.edu.vn"
 *             code: "123456"
 *     responses:
 *       200:
 *         description: Reset code verified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Reset code verified successfully."
 *       400:
 *         description: No reset request, expired code, or invalid code
 *       500:
 *         description: Server error
 *
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password after verifying reset code
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               newPassword:
 *                 type: string
 *           example:
 *             email: "22521407@gm.uit.edu.vn"
 *             newPassword: "uit2025"
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Password reset successfully."
 *       400:
 *         description: Reset code not verified
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
