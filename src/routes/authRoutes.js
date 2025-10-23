/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication and account management
 */

/**
 * @swagger
 * /api/auth/hello:
 *   get:
 *     summary: Test API connectivity
 *     tags: [Auth]
 *     description: Returns a simple "Hello World" message to verify the API is working.
 *     responses:
 *       200:
 *         description: Success message
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Hello World
 */

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     description: Registers a new user and sends a verification code to their email.
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
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: johndoe@example.com
 *               password:
 *                 type: string
 *                 example: myStrongPassword123
 *     responses:
 *       200:
 *         description: Verification code sent successfully.
 *       400:
 *         description: User already exists.
 *       500:
 *         description: Server error.
 */

/**
 * @swagger
 * /api/auth/verify-code:
 *   post:
 *     summary: Verify email code and create account
 *     tags: [Auth]
 *     description: Confirms the email verification code and creates the user's account if valid.
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
 *                 example: johndoe@example.com
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Email verified and account created successfully.
 *       400:
 *         description: Invalid or expired verification code.
 *       500:
 *         description: Server error.
 */

/**
 * @swagger
 * /api/auth/resend-code:
 *   post:
 *     summary: Resend email verification code
 *     tags: [Auth]
 *     description: Resends a new verification code for users who have already signed up but not verified yet.
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
 *                 example: johndoe@example.com
 *     responses:
 *       200:
 *         description: A new verification code was sent.
 *       400:
 *         description: No pending signup found.
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user and return token
 *     tags: [Auth]
 *     description: Logs in a verified user and returns a JWT token.
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
 *                 example: johndoe@example.com
 *               password:
 *                 type: string
 *                 example: myStrongPassword123
 *     responses:
 *       200:
 *         description: Successfully authenticated, returns JWT token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Invalid credentials or user does not exist.
 *       401:
 *         description: Email not verified.
 */

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     description: Retrieves information about the currently logged-in user.
 *     responses:
 *       200:
 *         description: Successfully retrieved user profile.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: 64bfe9c29a3b2a1234abc123
 *                 name:
 *                   type: string
 *                   example: John Doe
 *                 email:
 *                   type: string
 *                   example: johndoe@example.com
 *                 avatar:
 *                   type: string
 *                   example: https://api.dicebear.com/9.x/micah/svg?seed=John
 *       401:
 *         description: Unauthorized or missing token.
 *       404:
 *         description: User not found.
 */

/**
 * @swagger
 * /api/auth/request-password-reset:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
 *     description: Sends a password reset code to the user's email.
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
 *                 example: johndoe@example.com
 *     responses:
 *       200:
 *         description: Password reset code sent.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error.
 */

/**
 * @swagger
 * /api/auth/verify-reset-code:
 *   post:
 *     summary: Verify password reset code
 *     tags: [Auth]
 *     description: Verifies the reset code sent to the user's email before allowing password change.
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
 *                 example: johndoe@example.com
 *               code:
 *                 type: string
 *                 example: "654321"
 *     responses:
 *       200:
 *         description: Reset code verified successfully.
 *       400:
 *         description: Invalid or expired code.
 */

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset user password
 *     tags: [Auth]
 *     description: Allows a user with a verified reset code to set a new password.
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
 *                 example: johndoe@example.com
 *               newPassword:
 *                 type: string
 *                 example: newStrongPassword123
 *     responses:
 *       200:
 *         description: Password reset successfully.
 *       400:
 *         description: Verification required or invalid request.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error.
 */
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import authMiddleware from "../middleware/authMiddleware.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { Resend } from "resend";

dotenv.config();

const router = express.Router();
// Temporary in-memory store for verification codes
const pendingVerifications = new Map();

const resend = new Resend(process.env.RESEND_API_KEY);

// ✅ Email transporter (using environment variables)
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   port: 465, // use 465 for secure (SSL), or 587 for STARTTLS
//   secure: true,
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
//   connectionTimeout: 10000, // 10 seconds
// });

const getDicebearAvatar = (seed) =>
  `https://api.dicebear.com/9.x/micah/svg?seed=${encodeURIComponent(
    seed || "U"
  )}&backgroundColor=ffd5dc,ffdfbf&rounded=true`;

// GET /api/auth/hello
router.get("/hello", async (__, res) => {
  res.send("Hello World");
});

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

    // Hash password temporarily so we can store it safely
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Store pending data (expires after 10 minutes)
    pendingVerifications.set(email, {
      name,
      email,
      password: hashedPassword,
      code: verificationCode,
      expires: Date.now() + 10 * 60 * 1000,
    });

    // Send verification email
    // await transporter.sendMail({
    //   to: email,
    //   subject: "Your Recipedia Verification Code",
    //   html: `
    //     <h1>Welcome to Recipedia!</h1>
    //     <p>Here is your verification code:</p>
    //     <h2>${verificationCode}</h2>
    //     <p>This code will expire in 10 minutes.</p>
    //   `,
    // });
    await resend.emails.send({
      from: "Recipedia <onboarding@resend.dev>",
      to: email,
      subject: "Your Recipedia Verification Code",
      html: `
        <h1>Welcome to Recipedia!</h1>
        <p>Here is your verification code:</p>
        <h2>${verificationCode}</h2>
        <p>This code will expire in 10 minutes.</p>
      `,
    });
    res.json({ msg: "Verification code sent. Please check your inbox." });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

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

    // ✅ Create verified user in database
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

    res.json({ msg: "Email verified and account created successfully!" });
  } catch (err) {
    console.error("Verification error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

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

  // await transporter.sendMail({
  //   to: email,
  //   subject: "Your new Recipedia verification code",
  //   html: `
  //     <h1>Here’s your new verification code:</h1>
  //     <h2>${newCode}</h2>
  //     <p>This code expires in 10 minutes.</p>
  //   `,
  // });
  await resend.emails.send({
    from: "Recipedia <onboarding@resend.dev>",
    to: email,
    subject: "Your Recipedia Verification Code",
    html: `
      <h1>Here’s your new verification code:</h1>
      <h2>${newCode}</h2>
      <p>This code expires in 10 minutes.</p>
    `,
  });
  res.json({ msg: "A new verification code has been sent to your email." });
});

// Login user
router.post("/login", async (req, res) => {
  console.log(req.body);
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ msg: "User does not exist" });

  if (!user.isVerified)
    return res.status(401).json({ msg: "Please verify your email first" });

  console.log("Login attempt:", email, password);
  // console.log("Stored hash:", user.password);

  const isMatch = await bcrypt.compare(password, user.password);
  console.log("Compare result:", isMatch);

  if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });
  // ✅ Sign the token with user._id
  const token = jwt.sign(
    { id: user._id, email: user.email }, // <--- this is the important part
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({ token });
});

// GET /api/auth/me
router.get("/me", authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) return res.status(404).json({ msg: "User not found" });
  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
  });
});
// ===========================
// PASSWORD RESET FLOW
// ===========================

// Temporary in-memory store for password reset codes
const pendingResets = new Map();

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

    // Send email
    // await transporter.sendMail({
    //   to: email,
    //   subject: "Your Recipedia Password Reset Code",
    //   html: `
    //     <h1>Password Reset Request</h1>
    //     <p>Here is your password reset code:</p>
    //     <h2>${resetCode}</h2>
    //     <p>This code will expire in 10 minutes.</p>
    //     <p>If you did not request this, please ignore this email.</p>
    //   `,
    // });
    await resend.emails.send({
      from: "Recipedia <onboarding@resend.dev>",
      to: email,
      subject: "Your Recipedia Password Reset Code",
      html: `
        <h1>Password Reset Request</h1>
        <p>Here is your password reset code:</p>
        <h2>${resetCode}</h2>
        <p>This code will expire in 10 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    });
    res.json({ msg: "Password reset code sent to your email." });
  } catch (err) {
    console.error("Password reset request error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

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

  // ✅ Mark verified (but not yet reset)
  pending.verified = true;
  res.json({ msg: "Reset code verified successfully." });
});

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
