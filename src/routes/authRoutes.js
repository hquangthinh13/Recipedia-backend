import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import authMiddleware from "../middleware/authMiddleware.js";
import dotenv from "dotenv";
import sgMail from "@sendgrid/mail";
import axios from "axios";

async function getBase64FromURL(url) {
  const res = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(res.data).toString("base64");
}

dotenv.config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const pendingResets = new Map();

const router = express.Router();
// Temporary in-memory store for verification codes
const pendingVerifications = new Map();
const pattern = await getBase64FromURL(
  "https://res.cloudinary.com/dee339rpr/image/upload/v1763349597/Recipedia_Pattern_tib8sj.png"
);
const logo = await getBase64FromURL(
  "https://res.cloudinary.com/dee339rpr/image/upload/v1763349597/Recipedia-logo-square_rrtoxp.png"
);
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
      attachments: [
        {
          content: logo,
          filename: "Recipedia-logo.png",
          type: "image/png",
          disposition: "inline",
          content_id: "recipedia_logo",
        },
        {
          content: pattern,
          filename: "Recipedia-pattern.png",
          type: "image/png",
          disposition: "inline",
          content_id: "recipedia_pattern",
        },
      ],
      html: `
      <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@300..700&display=swap" rel="stylesheet">
    <title>Recipedia - Email Verification</title>
  </head>
  <body
    style="
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      background: linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%);
      font-family: 'Quicksand', sans-serif;
    "
  >
    <div
      style="
        background: #ffffff;
        color: #3d3436;
        border-radius: 24px;
        text-align: center;
        max-width: 520px;
        width: 100%;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        overflow: hidden;
      "
    >
      <!-- Top Pattern -->
      <div style="width: 100%; height: auto; padding: 20px; box-sizing: border-box;">
        <img
src="cid:recipedia_pattern"           alt="Recipedia Pattern"
          style="width: 100%; height: auto; display: block; border-radius: 12px 12px 0 0;"
        />
      </div>

      <!-- Content -->
      <div style="padding: 40px 40px 48px 40px;">
        <!-- Logo -->
        <div style="margin-bottom: 24px">
          <img
          src="cid:recipedia_logo"          alt="Recipedia Logo"
            style="width: 80px; height: auto"
          />
        </div>

        <!-- Welcome heading with email -->
        <h1 
          style="
            margin: 0 0 8px 0; 
            font-weight: 700;
            font-size: 28px;
            color: #2d2d2d;
          "
        >
          Welcome ${userEmail}
        </h1>
        
        <h2
          style="
            margin: 0 0 16px 0; 
            font-weight: 700;
            font-size: 28px;
            color: #2d2d2d;
          "
        >
          to Recipedia!
        </h2>
        
        <p 
          style="
            font-size: 16px; 
            margin: 0 0 8px 0; 
            font-weight: 400;
          "
        >
          Please enter the code below on the verification page to complete your sign-in.
        </p>

        <!-- Verification code box with gradient border -->
        <div
          style="
            background: #ff7e5f;
            padding: 3px;
            border-radius: 16px;
            margin: 32px 0;
            display: inline-block;
          "
        >
          <div
            style="
              background: #fff5f2;
              padding: 14px 28px;
              border-radius: 14px;
            "
          >
            <div
              style="
                color: #ff7e5f;
                font-size: 30px;
                font-weight: 700;
                letter-spacing: 3px;
              "
            >
              ${verificationCode}
            </div>
          </div>
        </div>

        <!-- Expiration notice -->
        <div
          style="
            background: #fff5f2;
            padding: 16px 20px;
            border-radius: 8px;
            margin-top: 20px;
            text-align: left;
            display: inline-block;
            max-width: 100%;
          "
        >
          <p 
            style="
              font-size: 14px; 
              margin: 0;
              color: #3d3436;
            "
          >
             <strong>This code will expire in 10 minutes</strong> for security reasons.
          </p>
        </div>

        <!-- Security notice -->
        <p 
          style="
            font-size: 13px; 
            margin: 24px 0 0 0;
            color: #999;
            line-height: 1.5;
          "
        >
          If you didn't request this code, please ignore this email.
        </p>
      </div>

      <!-- Bottom Pattern -->
      <div style="width: 100%; height: auto; padding: 20px; box-sizing: border-box;">
        <img
          src="cid:recipedia_pattern"           alt="Recipedia Pattern"

          style="width: 100%; height: auto; display: block; transform: rotate(180deg); border-radius: 0 0 12px 12px;"
        />
      </div>
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
    attachments: [
      {
        content: logo,
        type: "image/png",
        filename: "Recipedia-logo.png",
        disposition: "inline",
        content_id: "recipedia_logo",
      },
      {
        content: pattern,
        filename: "Recipedia-pattern.png",
        type: "image/png",
        disposition: "inline",
        content_id: "recipedia_pattern",
      },
    ],
    html: `
    <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@300..700&display=swap" rel="stylesheet">
    <title>Recipedia - Resend Verification Code</title>
  </head>
  <body
    style="
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      background: linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%);
      font-family: 'Quicksand', sans-serif;

    "
  >
    <div
      style="
        background: #ffffff;
        color: #3d3436;
        border-radius: 24px;
        text-align: center;
        max-width: 520px;
        width: 100%;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        overflow: hidden;
      "
    >
      <!-- Top Pattern -->
      <div style="width: 100%; height: auto; padding: 20px; box-sizing: border-box;">
        <img
    src="cid:recipedia_pattern"           alt="Recipedia Pattern"

          style="width: 100%; height: auto; display: block; border-radius: 12px 12px 0 0;"
        />
      </div>

      <!-- Content -->
      <div style="padding: 40px 40px 48px 40px;">
        <!-- Logo -->
        <div style="margin-bottom: 24px">
          <img
          src="cid:recipedia_logo"          alt="Recipedia Logo"

            style="width: 80px; height: auto"
          />
        </div>

        <!-- Heading -->
        <h1 
          style="
            margin: 0 0 16px 0; 
            font-weight: 700;
            font-size: 28px;
            color: #2d2d2d;
          "
        >
          New Verification Code
        </h1>
        
        <p 
            style="
              font-size: 16px; 
              margin: 0 0 8px 0;
              color: #3d3436;
            "
          >
             Your previous verification code has been <strong>invalidated</strong>.
             Here is your new verification code for ${email}.
             Please enter the code below on the verification page to complete your sign-in.
          </p>

        <div
          style="
            background: #ff7e5f;
            padding: 3px;
            border-radius: 16px;
            margin: 32px 0;
            display: inline-block;
          "
        >
          <div
            style="
              background: #fff5f2;
              padding: 14px 28px;
              border-radius: 14px;
            "
          >
            <div
              style="
                color: #ff7e5f;
                font-size: 30px;
                font-weight: 700;
                letter-spacing: 3px;
              "
            >
              ${newCode}
              
            </div>
          </div>
        </div>

        <!-- Combined notice -->
        <div
          style="
             background: #fff5f2;
            padding: 16px 20px;
            border-radius: 8px;
                margin-top: 20px;
                text-align: left;
                display: flex;
                justify-content: center;
                align-items: center;
                max-width: 100%; 
          "
        >
          <p 
            style="
              font-size: 14px; 
              margin: 0 0 0 0;
              color: #3d3436;
            "
          >
             <strong>This code will expire in 10 minutes</strong> for security reasons.
          </p>
        </div>

        <!-- Security notice -->
        <p 
          style="
            font-size: 13px; 
            margin: 24px 0 0 0;
            color: #999;
            line-height: 1.5;
          "
        >
          If you didn't request this code, please ignore this email.
        </p>
      </div>

      <!-- Bottom Pattern -->
      <div style="width: 100%; height: auto; padding: 20px; box-sizing: border-box;">
        <img
        src="cid:recipedia_pattern"           alt="Recipedia Pattern"

          style="width: 100%; height: auto; display: block; transform: rotate(180deg); border-radius: 0 0 12px 12px;"
        />
      </div>
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
      attachments: [
        {
          content: logo,
          type: "image/png",
          filename: "Recipedia-logo.png",
          disposition: "inline",
          content_id: "recipedia_logo",
        },
        {
          content: pattern,
          filename: "Recipedia-pattern.png",
          type: "image/png",
          disposition: "inline",
          content_id: "recipedia_pattern",
        },
      ],
      html: `
    <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@300..700&display=swap" rel="stylesheet">
    <title>Recipedia - Reset Password</title>
  </head>
  <body
    style="
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      background: linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%);
      font-family: 'Quicksand', sans-serif;
    "
  >
    <div
      style="
        background: #ffffff;
        color: #3d3436;
        border-radius: 24px;
        text-align: center;
        max-width: 520px;
        width: 100%;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        overflow: hidden;
      "
    >
      <!-- Top Pattern -->
      <div style="width: 100%; height: auto; padding: 20px; box-sizing: border-box;">
        <img
src="cid:recipedia_pattern"           alt="Recipedia Pattern"
          style="width: 100%; height: auto; display: block; border-radius: 12px 12px 0 0;"
        />
      </div>

      <!-- Content -->
      <div style="padding: 40px 40px 48px 40px;">
        <!-- Logo -->
        <div style="margin-bottom: 24px">
          <img

src="cid:recipedia_logo"          alt="Recipedia Logo"
            style="width: 80px; height: auto"
          />
        </div>

        <!-- Reset Password heading -->
        <h1 
          style="
            margin: 0 0 16px 0; 
            font-weight: 700;
            font-size: 28px;
            color: #2d2d2d;
          "
        >
          Reset Your Password
        </h1>
        
        <p 
          style="
            font-size: 16px; 
            margin: 0 0 8px 0; 
            font-weight: 400;
            color: #3d3436;
          "
        >
          Hi ${email},
        </p>

        <p 
          style="
            font-size: 16px; 
            margin: 0 0 8px 0; 
            font-weight: 400;
            line-height: 1.6;
          "
        >
          We received a request to reset your password. Please use the code below to create a new password.
        </p>

        <div
          style="
            background: #ff7e5f;
            padding: 3px;
            border-radius: 16px;
            margin: 32px 0;
            display: inline-block;
          "
        >
          <div
            style="
              background: #fff5f2;
              padding: 14px 28px;
              border-radius: 14px;
            "
          >
            <div
              style="
                color: #ff7e5f;
                font-size: 30px;
                font-weight: 700;
                letter-spacing: 3px;
              "
            >
              ${resetCode}
            </div>
          </div>
        </div>

        <div
          style="
            background: #fff5f2;
            padding: 16px 20px;
            border-radius: 8px;
            margin-top: 20px;
            text-align: left;
            display: inline-block;
            max-width: 100%;
          "
        >
          <p 
            style="
              font-size: 14px; 
              margin: 0;
              color: #3d3436;
            "
          >
             <strong>This code will expire in 10 minutes</strong> for security reasons.
          </p>
        </div>

        <div
          style="
           font-size: 13px; 
            margin: 24px 0 0 0;
            color: #999;
            line-height: 1.5;
          "
        >
          <p 
            style="
              font-size: 14px; 
              margin: 0;
              color: #3d3436;
              line-height: 1.6;
            "
          >
            <strong> Security Alert:</strong><br>
            If you didn't request a password reset, please ignore this email and your password will remain unchanged. Consider securing your account if you believe this was unauthorized.
          </p>
        </div>
      </div>

      <!-- Bottom Pattern -->
      <div style="width: 100%; height: auto; padding: 20px; box-sizing: border-box;">
        <img
src="cid:recipedia_pattern"           alt="Recipedia Pattern"
          style="width: 100%; height: auto; display: block; transform: rotate(180deg); border-radius: 0 0 12px 12px;"
        />
      </div>
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
