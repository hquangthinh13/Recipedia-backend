import express from "express";
import multer from "multer";

import authMiddleware from "../middleware/authMiddleware.js";
import {
  getAllRecipes,
  getTrendingRecipes,
  createRecipe,
  getRecipeById,
  getRecipeComments,
  addComment,
  deleteComment,
  deleteRecipe,
  updateRecipe,
  toggleLike,
  toggleFavorite,
  remixRecipe,
  suggestIngredientsAndTitles,
} from "../controllers/recipeController.js";

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

// List recipes
router.get("/", getAllRecipes);

// Search & Suggest
router.get("/suggest", suggestIngredientsAndTitles);

// Trending recipes
router.get("/trending", getTrendingRecipes);

// Create new recipe
router.post("/", authMiddleware, upload.single("coverImage"), createRecipe);

// Recipe detail
router.get("/:id", getRecipeById);

// Paginated comments
router.get("/:id/comments", getRecipeComments);

// Add comment
router.post("/:id/comments", authMiddleware, addComment);

// Delete comment
router.delete("/:id/comments/:commentId", authMiddleware, deleteComment);

// Update recipe
router.put("/:id", authMiddleware, upload.single("coverImage"), updateRecipe);

// Delete recipe
router.delete("/:id", authMiddleware, deleteRecipe);

// Like / unlike
router.post("/:id/like", authMiddleware, toggleLike);

// Favorite / unfavorite
router.post("/:id/favorite", authMiddleware, toggleFavorite);

// Remix
router.post(
  "/:id/remix",
  authMiddleware,
  upload.single("coverImage"),
  remixRecipe
);

export default router;
