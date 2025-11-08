import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import authMiddleware from "../middleware/authMiddleware.js";
import dotenv from "dotenv";
import sgMail from "@sendgrid/mail";

dotenv.config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const pendingResets = new Map();

const router = express.Router();
// Temporary in-memory store for verification codes
const pendingVerifications = new Map();

const getDicebearAvatar = (seed) =>
  `https://api.dicebear.com/9.x/micah/svg?seed=${encodeURIComponent(
    seed || "U"
  )}&backgroundColor=ffd5dc,ffdfbf&rounded=true`;
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

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "User already exists" });
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // Store pending data (expires after 10 minutes)
    pendingVerifications.set(email, {
      name,
      email,
      password: password,
      code: verificationCode,
      expires: Date.now() + 10 * 60 * 1000,
    });

    const msg = {
      to: email,
      from: "recipedia.co@gmail.com",
      subject: "Your Recipedia Verification Code",
      html: `
        <h1>Welcome to Recipedia!</h1>
        <p>Here is your verification code:</p>
        <h2>${verificationCode}</h2>
        <p>This code will expire in 10 minutes.</p>
      `,
    };
    try {
      await sgMail.send(msg);
    } catch (error) {
      console.error("SendGrid error:", error);
    }

    res.json({ msg: "Verification code sent. Please check your inbox." });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});
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

router.post("/verify-code", async (req, res) => {
  const { email, code } = req.body;

  try {
    const pending = pendingVerifications.get(email);
    if (!pending) {
      return res
        .status(400)
        .json({ msg: "No pending verification found for this email." });
    }

    // Check expiration
    if (Date.now() > pending.expires) {
      pendingVerifications.delete(email);
      return res.status(400).json({ msg: "Verification code expired." });
    }

    // Check code match
    if (pending.code !== code) {
      return res.status(400).json({ msg: "Invalid verification code." });
    }

    // Create verified user in database
    const avatarUrl = getDicebearAvatar(pending.name);
    const newUser = new User({
      name: pending.name,
      email: pending.email,
      password: pending.password,
      avatar: avatarUrl,
      isVerified: true,
    });

    await newUser.save();

    // Remove pending entry
    pendingVerifications.delete(email);
    // Auto-login: generate JWT
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      msg: "Email verified and account created successfully!",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        avatar: newUser.avatar,
      },
    });
  } catch (err) {
    console.error("Verification error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});
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

router.post("/resend-code", async (req, res) => {
  const { email } = req.body;
  const pending = pendingVerifications.get(email);

  if (!pending) {
    return res
      .status(400)
      .json({ msg: "No pending signup found. Please sign up again." });
  }

  // Generate a new code
  const newCode = Math.floor(100000 + Math.random() * 900000).toString();
  pending.code = newCode;
  pending.expires = Date.now() + 10 * 60 * 1000;

  const msg = {
    to: email,
    from: "recipedia.co@gmail.com",
    subject: `${newCode} is your new Recipedia verification code`,
    html: `
      <h1>Here’s your new verification code:</h1>
      <h2>${newCode}</h2>
      <p>This code expires in 10 minutes.</p>
      `,
  };
  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error("SendGrid error:", error);
  }
  res.json({ msg: "A new verification code has been sent to your email." });
});

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
// Login
router.post("/login", async (req, res) => {
  console.log(req.body);
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ msg: "User does not exist" });

  if (!user.isVerified)
    return res.status(401).json({ msg: "Please verify your email first" });

  console.log("Login attempt:", email, password);

  const isMatch = await bcrypt.compare(password, user.password);
  console.log("Compare result:", isMatch);

  if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });
  // Sign the token with user._id
  const token = jwt.sign(
    { id: user._id, email: user.email }, // important part
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({ token });
});

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

// GET /api/auth/me
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("favorites", "_id title coverImage"); // optional populate fields

    if (!user) return res.status(404).json({ msg: "User not found" });

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      createdAt: user.createdAt,
      favorites: user.favorites.map((fav) => fav._id), // return IDs only
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// ===========================
// PASSWORD RESET FLOW
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

// Request password reset
router.post("/request-password-reset", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: "No account found with this email." });
    }

    // Generate 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store reset request (10 min expiry)
    pendingResets.set(email, {
      code: resetCode,
      expires: Date.now() + 10 * 60 * 1000,
    });

    const msg = {
      to: email,
      from: "recipedia.co@gmail.com",
      subject: `${resetCode} is your Recipedia Password Reset Code`,
      html: `
        <h1>Password Reset Request</h1>
        <p>Here is your password reset code:</p>
        <h2>${resetCode}</h2>
        <p>This code will expire in 10 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    };
    try {
      await sgMail.send(msg);
    } catch (error) {
      console.error("SendGrid error:", error);
    }
    res.json({ msg: "Password reset code sent to your email." });
  } catch (err) {
    console.error("Password reset request error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});
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

// Verify reset code
router.post("/verify-reset-code", (req, res) => {
  const { email, code } = req.body;
  const pending = pendingResets.get(email);

  if (!pending) {
    return res
      .status(400)
      .json({ msg: "No reset request found for this email." });
  }

  if (Date.now() > pending.expires) {
    pendingResets.delete(email);
    return res.status(400).json({ msg: "Reset code expired." });
  }

  if (pending.code !== code) {
    return res.status(400).json({ msg: "Invalid reset code." });
  }

  // Mark verified (but not yet reset)
  pending.verified = true;
  res.json({ msg: "Reset code verified successfully." });
});
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

// Reset password
router.post("/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const pending = pendingResets.get(email);
    if (!pending || !pending.verified) {
      return res
        .status(400)
        .json({ msg: "Please verify your reset code first." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: "User not found." });
    }

    user.password = newPassword;
    await user.save();
    await user.save();

    // Remove pending reset entry
    pendingResets.delete(email);

    res.json({ msg: "Password reset successfully." });
  } catch (err) {
    console.error("Password reset error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;
