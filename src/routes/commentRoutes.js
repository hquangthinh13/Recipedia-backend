import express from "express";
import Recipe from "../models/Recipe.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// ===========================
// GET all comments for a recipe
// ===========================
router.get("/:recipeId", async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.recipeId).populate("comments.user", "username");
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });

    res.status(200).json(recipe.comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===========================
// ADD a new comment (auth required)
// ===========================
router.post("/:recipeId", authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    const recipe = await Recipe.findById(req.params.recipeId);
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });

    recipe.comments.push({ user: req.user.id, text });
    await recipe.save();

    // repopulate to return username
    await recipe.populate("comments.user", "username");

    res.status(201).json(recipe.comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===========================
// DELETE a comment (auth required)
// ===========================
router.delete("/:recipeId/:commentId", authMiddleware, async (req, res) => {
  try {
    const { recipeId, commentId } = req.params;
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });

    const comment = recipe.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (
      comment.user.toString() !== req.user.id && // comment author
      recipe.author.toString() !== req.user.id && // recipe author
      req.user.role !== "admin" // admin
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    comment.remove();
    await recipe.save();

    await recipe.populate("comments.user", "username");

    res.status(200).json(recipe.comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
