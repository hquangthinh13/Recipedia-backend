import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js"; // Make sure the filename matches exactly
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

const getDicebearAvatar = (seed) =>
  `https://api.dicebear.com/9.x/micah/svg?seed=${encodeURIComponent(
    seed || "U"
  )}&backgroundColor=ffd5dc,ffdfbf&rounded=true`;

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ msg: "User already exists" });
    }

    // ✅ hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({ name, email, password: passwordHash });
    await user.save();

    // ✅ directly return a token so the frontend doesn't need to call /login again
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (err) {
    console.error("Signup error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// Login user
router.post("/login", async (req, res) => {
  console.log(req.body);
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ msg: "User does not exist" });

  const isMatch = await bcrypt.compare(password, user.password);
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

export default router;
