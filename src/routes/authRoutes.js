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
    // ✅ Auto-login: generate JWT
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

// Login user
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
      favorites: user.favorites.map((fav) => fav._id), // return IDs only
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// ===========================
// PASSWORD RESET FLOW

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
