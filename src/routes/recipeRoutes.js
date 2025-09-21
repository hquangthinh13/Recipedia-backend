import express from "express";
import Recipe from "../models/Recipe.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Get all recipes (public)
router.get("/", async (_, res) => {
  try {
    const recipes = await Recipe.find()
      .populate("author", "username email")
      .sort({ createdAt: -1 });
    res.status(200).json(recipes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single recipe (public)
router.get("/:id", async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id)
      .populate("author", "username email")
      .populate("comments.user", "username");
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });
    res.status(200).json(recipe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new recipe
router.post("/", authMiddleware, async (req, res) => {
  try {
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
    res.status(500).json({ message: "Server error" });
  }
});

// Update recipe (author or admin only)
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });

    // Only author or admin
    if (recipe.author.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    Object.assign(recipe, req.body);
    const updatedRecipe = await recipe.save();

    res.status(200).json(updatedRecipe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete recipe (author or admin only)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });

    if (recipe.author.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    await recipe.deleteOne();
    res.status(200).json({ message: "Recipe deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Like recipe (auth required)
router.post("/:id/like", authMiddleware, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });

    recipe.dislikes = recipe.dislikes.filter(
      (id) => id.toString() !== req.user.id
    );

    if (recipe.likes.includes(req.user.id)) {
      recipe.likes = recipe.likes.filter((id) => id.toString() !== req.user.id);
    } else {
      recipe.likes.push(req.user.id);
    }

    await recipe.save();
    res.status(200).json(recipe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Dislike recipe (auth required)
router.post("/:id/dislike", authMiddleware, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });

    recipe.likes = recipe.likes.filter((id) => id.toString() !== req.user.id);

    if (recipe.dislikes.includes(req.user.id)) {
      recipe.dislikes = recipe.dislikes.filter(
        (id) => id.toString() !== req.user.id
      );
    } else {
      recipe.dislikes.push(req.user.id);
    }

    await recipe.save();
    res.status(200).json(recipe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
