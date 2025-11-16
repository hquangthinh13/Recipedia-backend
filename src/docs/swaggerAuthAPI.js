/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Start the user signup process (send verification code)
 *     tags: [Auth]
 *     description: >
 *       Begins the signup process by sending a 6-digit verification code to the user's email.
 *       The code expires in **10 minutes**.
 *       After receiving the code, the user must verify it through a separate verification endpoint before the account is created.
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
 *                 example: "Quang Thinh"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "hquangthinh@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "mypassword123"
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
 *         description: User already exists or invalid data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "User already exists"
 *       500:
 *         description: Server or SendGrid email error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Server error"
 */

/**
 * @swagger
 * /api/auth/verify-code:
 *   post:
 *     summary: Verify email and complete signup
 *     tags: [Auth]
 *     description: >
 *       Verifies the 6-digit code sent to the user's email during signup.
 *       If the code is valid and not expired, the user account is created, and a JWT token is returned for immediate login.
 *       Each verification code is valid for **10 minutes**.
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
 *                 description: The email address used during signup
 *                 example: "hquangthinh@example.com"
 *               code:
 *                 type: string
 *                 description: The 6-digit verification code sent via email
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Email successfully verified and account created
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
 *                   description: JWT token for immediate login
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "64f9876543abcde21098"
 *                     name:
 *                       type: string
 *                       example: "Quang Thinh"
 *                     email:
 *                       type: string
 *                       example: "hquangthinh@example.com"
 *                     avatar:
 *                       type: string
 *                       example: "https://api.dicebear.com/6.x/initials/svg?seed=John%20Doe"
 *       400:
 *         description: Invalid or expired verification code
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Verification code expired."
 *       500:
 *         description: Server error during verification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Server error"
 */

/**
 * @swagger
 * /api/auth/resend-code:
 *   post:
 *     summary: Resend a new verification code for signup
 *     tags: [Auth]
 *     description: >
 *       Resends a new 6-digit verification code to the user's email if a pending signup already exists.
 *       The previous code is replaced, and the new one expires in **10 minutes**.
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
 *                 description: The email address used during signup
 *                 example: "hquangthinh@example.com"
 *     responses:
 *       200:
 *         description: New verification code sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "A new verification code has been sent to your email."
 *       400:
 *         description: No pending signup found for this email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "No pending signup found. Please sign up again."
 *       500:
 *         description: Server or email sending error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Server error"
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in an existing user
 *     tags: [Auth]
 *     description: >
 *       Authenticates a registered and verified user using their email and password.
 *       Returns a signed JWT token that can be used to access protected endpoints (by including it in the `Authorization` header as `Bearer <token>`).
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
 *                 description: The user's registered email
 *                 example: "hquangthinh13@gmail.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 description: The user's password
 *                 example: "thinh2004"
 *     responses:
 *       200:
 *         description: Successful login, returns JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token to be used for authenticated requests
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Invalid credentials or user does not exist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Invalid credentials"
 *       401:
 *         description: Email not verified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Please verify your email first"
 *       500:
 *         description: Server error while logging in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Server error"
 */

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get the currently authenticated user's profile
 *     tags: [Auth]
 *     description: >
 *       Returns the authenticated user's profile information based on the provided JWT token.
 *       This endpoint requires authentication via the `Authorization` header (`Bearer <token>`).
 *       The password field is excluded from the response.
 *     security:
 *       - bearerAuth: []   # Requires JWT token
 *     responses:
 *       200:
 *         description: Successfully retrieved user information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "64f9876543abcde21098"
 *                 name:
 *                   type: string
 *                   example: "Taylor Swift"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-10-02T12:34:56.789Z"
 *                 email:
 *                   type: string
 *                   example: "taylorswift@example.com"
 *                 avatar:
 *                   type: string
 *                   example: "https://api.dicebear.com/6.x/initials/svg?seed=John%20Doe"
 *                 favorites:
 *                   type: array
 *                   description: List of recipe IDs the user has favorited
 *                   items:
 *                     type: string
 *                     example: "64f1234567abcde89012"
 *       401:
 *         description: Unauthorized — missing or invalid token
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
 *                   example: "User not found"
 *       500:
 *         description: Server error while fetching user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Server error"
 */

/**
 * @swagger
 * /api/auth/request-password-reset:
 *   post:
 *     summary: Request a password reset code
 *     tags: [Auth]
 *     description: >
 *       Starts the password reset process by sending a **6-digit verification code** to the user's registered email.
 *       The code expires in **10 minutes**.
 *       This endpoint is only for existing, verified users who forgot their password.
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
 *                 description: The email address of the user requesting the password reset
 *                 example: "hquangthinh@example.com"
 *     responses:
 *       200:
 *         description: Password reset code successfully sent
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "No account found with this email."
 *       500:
 *         description: Server or email sending error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Server error"
 */

/**
 * @swagger
 * /api/auth/verify-reset-code:
 *   post:
 *     summary: Verify the password reset code
 *     tags: [Auth]
 *     description: >
 *       Verifies the 6-digit password reset code previously sent to the user's email.
 *       If valid and not expired, marks the reset request as verified.
 *       The user must then proceed to set a new password using the `/api/auth/reset-password` endpoint.
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
 *                 description: The email address used for the password reset request
 *                 example: "hquangthinh@example.com"
 *               code:
 *                 type: string
 *                 description: The 6-digit reset code sent to the user's email
 *                 example: "654321"
 *     responses:
 *       200:
 *         description: Reset code verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Reset code verified successfully."
 *       400:
 *         description: Invalid, expired, or missing reset request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Invalid reset code."
 *       500:
 *         description: Server error while verifying code
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Server error"
 */

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset the user's password after verifying reset code
 *     tags: [Auth]
 *     description: >
 *       Completes the password reset process by updating the user's password.
 *       The user must have already verified their reset code through `/api/auth/verify-reset-code`.
 *       Once the password is successfully updated, the reset request is removed from the pending list.
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
 *                 description: The email address associated with the account
 *                 example: "thinh@example.com"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: The new password to set for the account
 *                 example: "newSecurePassword123"
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
 *         description: Reset code not verified or invalid request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Please verify your reset code first."
 *       404:
 *         description: User not found for the given email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "User not found."
 *       500:
 *         description: Server error while updating password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Server error"
 */
