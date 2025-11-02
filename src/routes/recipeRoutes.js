import express from "express";
import User from "../models/User.js";
import Recipe from "../models/Recipe.js";
import Notification from "../models/Notification.js";

import authMiddleware from "../middleware/authMiddleware.js";
import multer from "multer";
import sharp from "sharp";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier"; // for streaming buffer → cloudinary upload

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// Get all recipes with optional filters, sorting, and pagination
router.get("/", async (req, res) => {
  try {
    const { cookingTime, dishType, sort } = req.query;

    // pagination
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const skip = (page - 1) * limit;

    const filter = {};
    if (cookingTime) filter.cookingTime = cookingTime;
    if (dishType) filter.dishType = dishType;

    let query = Recipe.find(filter)
      .populate("author", "name email avatar")
      .populate("likes", "_id");

    // Sorting
    if (sort === "newest") query = query.sort({ createdAt: -1 });
    else if (sort === "oldest") query = query.sort({ createdAt: 1 });
    else if (sort === "liked") query = query.sort({ likeCount: -1 });
    else query = query.sort({ createdAt: -1 }); // default fallback

    const recipes = await query.skip(skip).limit(limit).lean();

    const userId = req.user?.id;
    const response = recipes.map((r) => ({
      ...r,
      likedByUser: userId
        ? r.likes.some(
            (id) =>
              id.toString() === userId.toString() ||
              (id?._id && id._id.toString() === userId.toString())
          )
        : false,
    }));

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get top trending recipes based on likes, comments, and recency
router.get("/trending", async (req, res) => {
  try {
    const n = parseInt(req.query.n, 10) || 10; // number of recipes to return
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    // Step 1: Fetch all recipes
    const recipes = await Recipe.find({})
      .populate("author", "name avatar")
      .lean();

    // Step 2: Compute trend score dynamically
    const trending = recipes
      .map((recipe) => {
        const likeCount = recipe.likeCount || 0;
        const commentCount = recipe.comments?.length || 0;

        // Recency boost: newer recipes get a small extra multiplier
        const createdAt = new Date(recipe.createdAt);
        const daysSince = (now - createdAt) / (1000 * 60 * 60 * 24);
        const recencyBoost = daysSince <= 7 ? (7 - daysSince) * 1.5 : 0;

        const trendScore = likeCount * 2 + commentCount * 1.5 + recencyBoost;

        return {
          ...recipe,
          commentCount,
          trendScore,
        };
      })
      // Step 3: Sort by computed trend score, then by creation date
      .sort((a, b) => {
        if (b.trendScore !== a.trendScore) return b.trendScore - a.trendScore;
        return new Date(b.createdAt) - new Date(a.createdAt);
      })
      .slice(0, n);

    res.status(200).json(trending);
  } catch (error) {
    console.error("Error fetching trending recipes:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Create new recipe: upload image + process + save recipe
router.post(
  "/",
  authMiddleware,
  upload.single("coverImage"),
  async (req, res) => {
    try {
      const { title, cookingTime, dishType, ingredients, instructions } =
        req.body;
      if (!title || !ingredients || !instructions)
        return res.status(400).json({ message: "Missing required fields" });

      // Process image with Sharp
      const imageBuffer = await sharp(req.file.buffer)
        .resize({ width: 1280, height: 720, fit: "cover" }) // 16:9 crop
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toBuffer();

      // Upload to Cloudinary using a stream
      const uploadStream = () =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "recipes",
              format: "jpeg",
              transformation: [{ width: 1280, height: 720, crop: "fill" }],
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          streamifier.createReadStream(imageBuffer).pipe(stream);
        });

      const cloudinaryResult = await uploadStream();

      // Parse ingredients safely (if frontend sends JSON string)
      const parsedIngredients =
        typeof ingredients === "string" ? JSON.parse(ingredients) : ingredients;

      // Save recipe to MongoDB
      const recipe = await Recipe.create({
        title,
        author: req.user.id,
        coverImage: cloudinaryResult.secure_url,
        cookingTime,
        dishType,
        ingredients: parsedIngredients,
        instructions,
      });

      res.status(201).json({
        message: "Recipe created successfully",
        recipe,
      });
    } catch (error) {
      console.error("Error creating full recipe:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// Get recipe by ID
router.get("/:id", async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id)
      .populate("author", "name email avatar")
      .populate("comments.user", "name avatar");
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });
    // Sort comments by createdAt descending
    recipe.comments.sort((a, b) => b.createdAt - a.createdAt);
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a recipe
router.put(
  "/:id",
  authMiddleware,
  upload.single("coverImage"), // optional new image
  async (req, res) => {
    try {
      const recipeId = req.params.id;
      const userId = req.user.id;

      // Fetch the recipe
      const recipe = await Recipe.findById(recipeId);
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }

      // Ensure the recipe belongs to the logged-in user
      if (recipe.author.toString() !== userId.toString()) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { title, cookingTime, dishType, ingredients, instructions } =
        req.body;

      // Optional new image handling
      let coverImageUrl = recipe.coverImage;
      if (req.file) {
        // Process + upload to Cloudinary
        const imageBuffer = await sharp(req.file.buffer)
          .resize({ width: 1280, height: 720, fit: "cover" })
          .toFormat("jpeg")
          .jpeg({ quality: 90 })
          .toBuffer();

        const uploadStream = () =>
          new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: "recipes",
                format: "jpeg",
                transformation: [{ width: 1280, height: 720, crop: "fill" }],
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );
            streamifier.createReadStream(imageBuffer).pipe(stream);
          });

        const cloudinaryResult = await uploadStream();
        coverImageUrl = cloudinaryResult.secure_url;
      }

      // Parse ingredients if JSON string
      const parsedIngredients =
        typeof ingredients === "string" ? JSON.parse(ingredients) : ingredients;

      // Update fields
      recipe.title = title || recipe.title;
      recipe.cookingTime = cookingTime || recipe.cookingTime;
      recipe.dishType = dishType || recipe.dishType;
      recipe.ingredients = parsedIngredients || recipe.ingredients;
      recipe.instructions = instructions || recipe.instructions;
      recipe.coverImage = coverImageUrl;

      const updatedRecipe = await recipe.save();
      const populatedRecipe = await Recipe.findById(updatedRecipe._id).populate(
        "author",
        "name avatar _id"
      ); // pick only needed fields

      res.status(200).json({
        message: "Recipe updated successfully",
        recipe: populatedRecipe,
      });
    } catch (error) {
      console.error("Error updating recipe:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// Like or unlike a recipe
router.post("/:id/like", authMiddleware, async (req, res) => {
  try {
    const recipeId = req.params.id;
    const userId = req.user.id; // taken from token (authMiddleware)

    // Fetch the recipe
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    // Check if user already liked it
    const alreadyLiked = recipe.likes.includes(userId);

    if (alreadyLiked) {
      // Unlike (remove from likes)
      recipe.likes = recipe.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      // Like (add to likes)
      recipe.likes.push(userId);
      // create notification
      if (recipe.author.toString() !== userId.toString()) {
        await Notification.create({
          recipient: recipe.author,
          sender: userId,
          type: "like",
          recipe: recipe._id,
        });
      }
    }

    recipe.likeCount = recipe.likes.length;
    await recipe.save();
    res.status(200).json({
      message: alreadyLiked ? "Recipe unliked" : "Recipe liked",
      likesCount: recipe.likes.length,
      likedByUser: !alreadyLiked,
    });
  } catch (error) {
    console.error("Error liking recipe:", error);
    res.status(500).json({ message: error.message });
  }
});

// Add or remove a recipe from favorites
router.post("/:id/favorite", authMiddleware, async (req, res) => {
  try {
    const recipeId = req.params.id;
    const userId = req.user.id; // from token

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if recipe exists
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    // Toggle favorite
    const alreadyFavorited = user.favorites.includes(recipeId);

    if (alreadyFavorited) {
      // Remove from favorites
      user.favorites = user.favorites.filter(
        (id) => id.toString() !== recipeId.toString()
      );
    } else {
      // Add to favorites
      user.favorites.push(recipeId);
    }

    await user.save();

    res.status(200).json({
      message: alreadyFavorited
        ? "Recipe removed from favorites"
        : "Recipe added to favorites",
      favorites: user.favorites,
      isFavorite: !alreadyFavorited,
    });
  } catch (error) {
    console.error("Error updating favorites:", error);
    res.status(500).json({ message: error.message });
  }
});

// Comment on a recipe
router.post("/:id/comments", authMiddleware, async (req, res) => {
  try {
    const recipeId = req.params.id;
    const userId = req.user.id;
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "Comment text is required." });
    }

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found." });
    }

    // Create comment
    const newComment = {
      user: userId,
      text: text.trim(),
      createdAt: new Date(),
    };

    // Add to the recipe's comments array
    recipe.comments.push(newComment);
    await recipe.save();
    if (recipe.author.toString() !== userId.toString()) {
      await Notification.create({
        recipient: recipe.author,
        sender: userId,
        type: "comment",
        recipe: recipe._id,
        commentText: text,
      });
    }
    // Optionally populate user info for the response
    const populatedRecipe = await recipe.populate({
      path: "comments.user",
      select: "name avatar",
    });

    // Get the last comment (the one we just added)
    const addedComment =
      populatedRecipe.comments[populatedRecipe.comments.length - 1];

    res.status(201).json({
      message: "Comment added successfully.",
      comment: addedComment,
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete a recipe
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const recipeId = req.params.id;
    const userId = req.user.id;
    const recipe = await Recipe.findById(recipeId);

    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }
    if (recipe.author.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    await Recipe.findByIdAndDelete(recipeId);
    res.status(200).json({ message: "Recipe deleted successfully" });
  } catch (error) {
    console.error("Error deleting recipe:", error);
    res.status(500).json({ message: error.message });
  }
});
export default router;
