/**
 * @swagger
 * tags:
 *   name: Recipes
 *   description: API endpoints for managing recipes
 */

/**
 * @swagger
 * /api/recipes:
 *   get:
 *     summary: Get all recipes
 *     tags: [Recipes]
 *     description: Retrieve a paginated list of all recipes, with optional filtering and sorting.
 *     parameters:
 *       - in: query
 *         name: cookingTime
 *         schema:
 *           type: string
 *         description: Filter recipes by cooking time (e.g., "30 minutes")
 *       - in: query
 *         name: dishType
 *         schema:
 *           type: string
 *         description: Filter recipes by dish type (e.g., "Dessert", "Main course")
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, oldest, liked]
 *         description: Sort recipes by newest, oldest, or most liked
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 20
 *         description: Number of recipes per page (max 100)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Page number for pagination
 *     responses:
 *       200:
 *         description: A list of recipes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     example: 64bfa1d2e3456789abcdef12
 *                   title:
 *                     type: string
 *                     example: Classic Chocolate Cake
 *                   author:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: John Doe
 *                       email:
 *                         type: string
 *                         example: johndoe@example.com
 *                   coverImage:
 *                     type: string
 *                     example: https://example.com/chocolate-cake.jpg
 *                   cookingTime:
 *                     type: string
 *                     example: 45 minutes
 *                   dishType:
 *                     type: string
 *                     example: Dessert
 *                   ingredients:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["2 eggs", "1 cup flour", "1/2 cup sugar"]
 *                   instructions:
 *                     type: string
 *                     example: Mix ingredients and bake for 30 minutes at 180°C.
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/recipes:
 *   post:
 *     summary: Create a new recipe
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     description: Creates a new recipe. Requires authentication.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - ingredients
 *               - instructions
 *             properties:
 *               title:
 *                 type: string
 *                 example: Fresh Mango Smoothie
 *               coverImage:
 *                 type: string
 *                 example: https://example.com/mango-smoothie.jpg
 *               cookingTime:
 *                 type: string
 *                 example: 10 minutes
 *               dishType:
 *                 type: string
 *                 example: Beverage
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["1 ripe mango", "1 cup milk", "ice cubes"]
 *               instructions:
 *                 type: string
 *                 example: Blend all ingredients until smooth.
 *     responses:
 *       201:
 *         description: Recipe created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   example: 64bfa1d2e3456789abcdef12
 *                 title:
 *                   type: string
 *                   example: Fresh Mango Smoothie
 *                 author:
 *                   type: string
 *                   example: 64bf9b7ca12bc9ef12345678
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/recipes/{id}:
 *   get:
 *     summary: Get a recipe by ID
 *     tags: [Recipes]
 *     description: Retrieve detailed information about a specific recipe by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The recipe ID
 *     responses:
 *       200:
 *         description: Recipe details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   example: 64bfa1d2e3456789abcdef12
 *                 title:
 *                   type: string
 *                   example: Classic Chocolate Cake
 *                 author:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: John Doe
 *                     email:
 *                       type: string
 *                       example: johndoe@example.com
 *                 coverImage:
 *                   type: string
 *                   example: https://example.com/chocolate-cake.jpg
 *                 cookingTime:
 *                   type: string
 *                   example: 45 minutes
 *                 dishType:
 *                   type: string
 *                   example: Dessert
 *                 ingredients:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["2 eggs", "1 cup flour", "1/2 cup sugar"]
 *                 instructions:
 *                   type: string
 *                   example: Mix ingredients and bake for 30 minutes at 180°C.
 *       404:
 *         description: Recipe not found
 *       500:
 *         description: Server error
 */
import express from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import Recipe from "../models/Recipe.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

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
      .populate("author", "name email")
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

// Create new recipe
router.post("/", authMiddleware, async (req, res) => {
  try {
    console.log("Decoded user from token:", req.user); // 👀 check token payload
    console.log("Incoming recipe data:", req.body); // 👀 check FE payload

    const {
      title,
      coverImage,
      cookingTime,
      dishType,
      ingredients,
      instructions,
    } = req.body;

    if (!title || !ingredients || ingredients.length === 0) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newRecipe = new Recipe({
      title,
      author: req.user.id, // always taken from token
      coverImage,
      cookingTime,
      dishType,
      ingredients,
      instructions,
    });

    await newRecipe.save();

    res.status(201).json(newRecipe);
  } catch (error) {
    console.error("Error creating recipe:", error);
    res.status(500).json({ message: error.message }); // return real error
  }
});

// /api/recipes/:id
router.get("/:id", async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id)
      .populate("author", "name email")
      .populate("comments.user", "name avatar");
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

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
    }

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
// POST /api/recipes/:id/comments
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
export default router;
