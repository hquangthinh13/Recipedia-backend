import express from "express";
import Recipe from "../models/Recipe.js";

const router = express.Router();

// .sort({ createdAt: -1 })  // Sort by creation date, newest first
// .sort({ createdAt: 1 })   // Sort by creation date, oldest first


// Get all recipes
router.get("/", async (_, res) => {
  try {
    const recipes = await Recipe.find().sort({ createdAt: -1 });
    res.status(200).json(recipes);  
  }
  catch (error) {
    console.error("Error fetching recipes:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get a single recipe by ID
router.get("/:id", async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }
    res.status(200).json(recipe);
  } catch (error) {
    console.error("Error fetching recipe:", error);
    res.status(500).json({ message: error.message });
  }
});

//Create a new recipe
router.post("/", async(req, res) => {
  try {
    const { title, instructions } = req.body;
    const newRecipe = new Recipe({ title, instructions });
    const savedRecipe = await newRecipe.save();
    res.status(201).json(savedRecipe);
  }
  catch (error) {
    console.error("Error creating recipe:", error);
    res.status(500).json({ message: error.message });
  }
});

// Update a recipe
router.put("/:id", async (req, res) => {
  try {
      const { title, instructions } = req.body;
      const updatedRecipe = await Recipe.findByIdAndUpdate(req.params.id, { title, instructions }, { new: true });
      if (!updatedRecipe) {
          return res.status(404).json({ message: "Recipe not found" });
      }
      res.status(200).json(updatedRecipe);
  } 
  catch (error) {
      console.error("Error updating recipe:", error);
      res.status(500).json({ message: error.message });
  }
});

// Delete a recipe
router.delete("/:id", async (req, res) => {
  try {
      const deletedRecipe = await Recipe.findByIdAndDelete(req.params.id);
      if (!deletedRecipe) {
          return res.status(404).json({ message: "Recipe not found" });
      }
      res.status(200).json(deletedRecipe);
  } catch (error) {
      console.error("Error deleting recipe:", error);
      res.status(500).json({ message: error.message });
  }
});

export default router;
