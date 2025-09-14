import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

// JWT secret (better to put in .env)
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// =======================
// AUTH ROUTES
// =======================

// Register new user
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already in use" });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      passwordHash,
    });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: error.message });
  }
});

// Login user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: error.message });
  }
});

// =======================
// USER ROUTES
// =======================

// Middleware to protect routes
function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Expect "Bearer TOKEN"

  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // attach decoded token (id, role) to req
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
}

// Get all users (admin only)
router.get("/", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });

    const users = await User.find().select("-passwordHash");
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get user by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.id !== req.params.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const user = await User.findById(req.params.id).select("-passwordHash").populate("favorites");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: error.message });
  }
});

// Add recipe to favorites
router.post("/:id/favorites", authMiddleware, async (req, res) => {
  try {
    const { recipeId } = req.body;

    if (req.user.id !== req.params.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.favorites.includes(recipeId)) {
      user.favorites.push(recipeId);
    }

    await user.save();
    res.status(200).json(user.favorites);
  } catch (error) {
    console.error("Error adding favorite:", error);
    res.status(500).json({ message: error.message });
  }
});

// Remove recipe from favorites
router.delete("/:id/favorites/:recipeId", authMiddleware, async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.favorites = user.favorites.filter(r => r.toString() !== req.params.recipeId);
    await user.save();

    res.status(200).json(user.favorites);
  } catch (error) {
    console.error("Error removing favorite:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
