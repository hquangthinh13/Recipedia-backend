// import express from "express";
// import Recipe from "../models/Recipe.js";

// const router = express.Router();

// // .sort({ createdAt: -1 })  // Sort by creation date, newest first
// // .sort({ createdAt: 1 })   // Sort by creation date, oldest first


// // Get all recipes
// router.get("/", async (_, res) => {
//   try {
//     const recipes = await Recipe.find().sort({ createdAt: -1 });
//     res.status(200).json(recipes);  
//   }
//   catch (error) {
//     console.error("Error fetching recipes:", error);
//     res.status(500).json({ message: error.message });
//   }
// });

// // Get a single recipe by ID
// router.get("/:id", async (req, res) => {
//   try {
//     const recipe = await Recipe.findById(req.params.id);
//     if (!recipe) {
//       return res.status(404).json({ message: "Recipe not found" });
//     }
//     res.status(200).json(recipe);
//   } catch (error) {
//     console.error("Error fetching recipe:", error);
//     res.status(500).json({ message: error.message });
//   }
// });

// //Create a new recipe
// router.post("/", async(req, res) => {
//   try {
//     const { title, instructions } = req.body;
//     const newRecipe = new Recipe({ title, instructions });
//     const savedRecipe = await newRecipe.save();
//     res.status(201).json(savedRecipe);
//   }
//   catch (error) {
//     console.error("Error creating recipe:", error);
//     res.status(500).json({ message: error.message });
//   }
// });

// // Update a recipe
// router.put("/:id", async (req, res) => {
//   try {
//       const { title, instructions } = req.body;
//       const updatedRecipe = await Recipe.findByIdAndUpdate(req.params.id, { title, instructions }, { new: true });
//       if (!updatedRecipe) {
//           return res.status(404).json({ message: "Recipe not found" });
//       }
//       res.status(200).json(updatedRecipe);
//   } 
//   catch (error) {
//       console.error("Error updating recipe:", error);
//       res.status(500).json({ message: error.message });
//   }
// });

// // Delete a recipe
// router.delete("/:id", async (req, res) => {
//   try {
//       const deletedRecipe = await Recipe.findByIdAndDelete(req.params.id);
//       if (!deletedRecipe) {
//           return res.status(404).json({ message: "Recipe not found" });
//       }
//       res.status(200).json(deletedRecipe);
//   } catch (error) {
//       console.error("Error deleting recipe:", error);
//       res.status(500).json({ message: error.message });
//   }
// });

// export default router;


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

// Create recipe (auth required)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, instructions, cookingTime, dishType, ingredients, coverImage } = req.body;
    const newRecipe = new Recipe({
      title,
      instructions,
      cookingTime,
      dishType,
      ingredients,
      coverImage,
      author: req.user.id, // logged-in user is author
    });

    const savedRecipe = await newRecipe.save();
    res.status(201).json(savedRecipe);
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    recipe.dislikes = recipe.dislikes.filter(id => id.toString() !== req.user.id);

    if (recipe.likes.includes(req.user.id)) {
      recipe.likes = recipe.likes.filter(id => id.toString() !== req.user.id);
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

    recipe.likes = recipe.likes.filter(id => id.toString() !== req.user.id);

    if (recipe.dislikes.includes(req.user.id)) {
      recipe.dislikes = recipe.dislikes.filter(id => id.toString() !== req.user.id);
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

