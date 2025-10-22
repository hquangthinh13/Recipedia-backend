import express from "express";
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

    let query = Recipe.find(filter).populate("author", "name email");

    // Sorting
    if (sort === "newest") query = query.sort({ createdAt: -1 });
    if (sort === "oldest") query = query.sort({ createdAt: 1 });
    if (sort === "liked") query = query.sort({ likes: -1 }); // assumes you track likes

    const recipes = await query.skip(skip).limit(limit).exec();
    // return plain array to avoid breaking existing client code
    res.json(recipes);
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
router.get("/:id", async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id).populate(
      "author",
      "name email"
    );
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
export default router;
