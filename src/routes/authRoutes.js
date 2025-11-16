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
      subject: `${verificationCode} is Your Recipedia Verification Code`,
      html: `
  <html>
    <head>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap" rel="stylesheet" />
    </head>
    <body style="margin:0; padding:0; background-color:#ff7e5f;">
      <div style="font-family: 'Outfit', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: linear-gradient(135deg, #ff7e5f, #feb47b); color: #3d3436; padding: 40px; border-radius: 16px; text-align: center; max-width: 500px; margin: auto; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <h1 style="color:#ffffff; margin-bottom:16px; font-weight:700;">Welcome to Recipedia!</h1>
        <p style="color:#ffffff; font-size:16px; margin-bottom:8px; font-weight:400;">Here is your verification code:</p>
        <div style="background:#ffffff; color:#3d3436; display:inline-block; padding:14px 28px; border-radius:14px; font-size:30px; font-weight:700; letter-spacing:3px; margin:16px 0;">
          ${verificationCode}
        </div>
        <p style="color:#ffffff; font-size:15px; margin-top:10px;">This code will expire in <strong>10 minutes</strong>.</p>
      </div>
    </body>
  </html>
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
    <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style="margin:0; padding:0; background-color:#ff7e5f;">
        <div style="font-family: 'Outfit', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: linear-gradient(135deg, #ff7e5f, #feb47b); color: #3d3436; padding: 40px; border-radius: 16px; text-align: center; max-width: 500px; margin: auto; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <h1 style="color: #ffffff; margin-bottom: 12px; font-weight: 600;">Here’s your new verification code:</h1>
          <div style="background: #ffffff; color: #3d3436; display: inline-block; padding: 14px 28px; border-radius: 14px; font-size: 32px; font-weight: 700; letter-spacing: 3px; margin: 16px 0;">
            ${newCode}
          </div>
          <p style="color: #ffffff; font-size: 15px; margin-top: 10px; font-weight: 400;">
            This code expires in <strong>10 minutes</strong>.
          </p>
        </div>
      </body>
    </html>
  `,
  };
  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error("SendGrid error:", error);
  }
  res.json({ msg: "A new verification code has been sent to your email." });
});

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

  // Mark verified (but not yet reset)
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
