import express from "express";
import User from "../models/User.js";
import Recipe from "../models/Recipe.js";
import Notification from "../models/Notification.js";
import authMiddleware from "../middleware/authMiddleware.js";
import multer from "multer";
import sharp from "sharp";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";
import { processAndUploadRecipeImage } from "../util/imageUpload.js";
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
//-----

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

      const uploadInfo = await processAndUploadRecipeImage(req.file);

      // Parse ingredients safely (if frontend sends JSON string)
      const parsedIngredients =
        typeof ingredients === "string" ? JSON.parse(ingredients) : ingredients;

      // Save recipe to MongoDB
      const recipe = await Recipe.create({
        title,
        author: req.user.id,
        coverImage: uploadInfo.coverImage,
        coverImagePublicId: uploadInfo.coverImagePublicId,
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

// Get recipe by ID (including parentRecipe if any)
router.get("/:id", async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id)
      .populate("author", "name email avatar")
      .populate({
        path: "parentRecipe",
        select:
          "title coverImage author remixCount createdAt dishType cookingTime likeCount comments",
        populate: {
          path: "author",
          select: "name avatar",
        },
      });

    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    res.json(recipe);
  } catch (error) {
    console.error("Get recipe by id failed:", error);
    res.status(500).json({ message: error.message });
  }
});

// GET /api/recipes/:id/comments?page=&limit=&sort=
router.get("/:id/comments", async (req, res) => {
  try {
    const recipeId = req.params.id;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
    const sort = req.query.sort === "oldest" ? "oldest" : "newest";

    const recipe = await Recipe.findById(recipeId).select("comments").lean();
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });

    // sort in-memory
    const sorted =
      sort === "oldest"
        ? [...(recipe.comments || [])].sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
          )
        : [...(recipe.comments || [])].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );

    const totalCount = sorted.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    const current = Math.min(page, totalPages);
    const start = (current - 1) * limit;
    const items = sorted.slice(start, start + limit);

    // manual "populate" of comment.user (name, avatar)
    const userIds = [
      ...new Set(items.map((c) => c.user && c.user.toString()).filter(Boolean)),
    ];
    const users = await User.find({ _id: { $in: userIds } })
      .select("name avatar")
      .lean();
    const userMap = Object.fromEntries(
      users.map((u) => [
        u._id.toString(),
        { _id: u._id, name: u.name, avatar: u.avatar },
      ])
    );

    const comments = items.map((c) => ({
      _id: c._id,
      text: c.text,
      createdAt: c.createdAt,
      user: userMap[c.user?.toString()] || c.user, // small safeguard
    }));

    res.json({
      comments,
      page: current,
      limit,
      totalPages,
      totalCount,
      sort,
    });
  } catch (error) {
    console.error("Error fetching paginated comments:", error);
    res.status(500).json({ message: "Server error", error: error.message });
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

// DELETE /api/recipes/:id/comments/:commentId
// Requires auth; only the comment owner can delete their comment.
router.delete("/:id/comments/:commentId", authMiddleware, async (req, res) => {
  try {
    const { id: recipeId, commentId } = req.params;
    const userId = req.user.id; // set by your verifyToken middleware

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });

    const target = recipe.comments.id(commentId);
    if (!target) return res.status(404).json({ message: "Comment not found" });

    // ownership check (only comment author can delete)
    if (String(target.user) !== String(userId)) {
      return res
        .status(403)
        .json({ message: "Not allowed to delete this comment" });
    }

    target.deleteOne(); // remove the subdocument
    await recipe.save();

    return res.json({
      message: "Comment deleted",
      commentId,
      totalCount: recipe.comments.length,
    });
  } catch (error) {
    console.error("Delete comment failed:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// DELETE /api/recipes/:id
// Requires auth; only the recipe owner can delete
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const recipeId = req.params.id;
    const userId = req.user.id;

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });

    // Ownership check
    if (String(recipe.author) !== String(userId)) {
      return res
        .status(403)
        .json({ message: "Not allowed to delete this recipe" });
    }
    // If this is a remix, decrement the parent's remixCount
    if (recipe.parentRecipe) {
      try {
        await Recipe.updateOne(
          {
            _id: recipe.parentRecipe,
            remixCount: { $gt: 0 }, // avoid going negative
          },
          {
            $inc: { remixCount: -1 },
          }
        );
      } catch (e) {
        console.error("Failed to decrement parent remixCount:", e);
        // don't block deletion if this fails
      }
    }
    // 1) Delete image from Cloudinary if we have the public_id
    if (recipe.coverImagePublicId) {
      try {
        await cloudinary.uploader.destroy(recipe.coverImagePublicId, {
          resource_type: "image",
          invalidate: true, // purge CDN cache
        });
      } catch (e) {
        // Log but don't block recipe deletion
        console.error("Cloudinary destroy failed:", e);
      }
    } else if (recipe.coverImage) {
      // Fallback: derive public_id from the URL if old records don't have it
      const match = recipe.coverImage.match(
        /\/upload\/(?:v\d+\/)?(.+?)\.(?:jpg|jpeg|png|gif|webp|svg)$/i
      );
      const derivedPublicId = match?.[1]; // e.g. "recipes/abc123"
      if (derivedPublicId) {
        try {
          await cloudinary.uploader.destroy(derivedPublicId, {
            resource_type: "image",
            invalidate: true,
          });
        } catch (e) {
          console.error("Cloudinary destroy (derived) failed:", e);
        }
      }
    }

    // 2) Delete the recipe document
    await recipe.deleteOne();

    return res.json({ message: "Recipe deleted successfully", recipeId });
  } catch (error) {
    console.error("Delete recipe failed:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update a recipe
router.put(
  "/:id",
  authMiddleware,
  upload.single("coverImage"),
  async (req, res) => {
    try {
      const recipeId = req.params.id;
      const userId = req.user.id;

      const recipe = await Recipe.findById(recipeId);
      if (!recipe) return res.status(404).json({ message: "Recipe not found" });

      // Ownership
      if (String(recipe.author) !== String(userId)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { title, cookingTime, dishType, ingredients, instructions } =
        req.body;

      // Handle optional new image
      let newCoverUrl = recipe.coverImage;
      let newPublicId = recipe.coverImagePublicId;

      if (req.file) {
        // Pre-process with Sharp (16:9, jpeg)
        const imageBuffer = await sharp(req.file.buffer)
          .resize({ width: 1280, height: 720, fit: "cover" })
          .toFormat("jpeg")
          .jpeg({ quality: 90 })
          .toBuffer();

        // If we already have a public_id, overwrite in place (best for keeping same ID)
        if (recipe.coverImagePublicId) {
          const uploadStream = () =>
            new Promise((resolve, reject) => {
              const stream = cloudinary.uploader.upload_stream(
                {
                  public_id: recipe.coverImagePublicId, // overwrite same asset
                  overwrite: true,
                  invalidate: true,
                  resource_type: "image",
                  // Optional: keep a stored original with same size (you already resized with Sharp)
                  folder: undefined, // not needed when public_id is full path
                  format: "jpeg",
                },
                (error, result) => (error ? reject(error) : resolve(result))
              );
              streamifier.createReadStream(imageBuffer).pipe(stream);
            });

          const result = await uploadStream();
          newCoverUrl = result.secure_url; // will include new version (v###)
          newPublicId = result.public_id; // stays the same as before
        } else {
          // No stored public_id (legacy docs). Upload new, then delete old by deriving public_id.
          const uploadStream = () =>
            new Promise((resolve, reject) => {
              const stream = cloudinary.uploader.upload_stream(
                {
                  folder: "recipes",
                  format: "jpeg",
                  resource_type: "image",
                },
                (error, result) => (error ? reject(error) : resolve(result))
              );
              streamifier.createReadStream(imageBuffer).pipe(stream);
            });

          const result = await uploadStream();
          newCoverUrl = result.secure_url;
          newPublicId = result.public_id;

          // Try to delete the old one by deriving public_id from URL
          if (recipe.coverImage) {
            const match = recipe.coverImage.match(
              /\/upload\/(?:v\d+\/)?(.+?)\.(?:jpg|jpeg|png|gif|webp|svg)$/i
            );
            const oldPublicId = match?.[1]; // e.g. "recipes/abc123"
            if (oldPublicId) {
              try {
                await cloudinary.uploader.destroy(oldPublicId, {
                  resource_type: "image",
                  invalidate: true,
                });
              } catch (e) {
                console.error("Cloudinary destroy (derived) failed:", e);
              }
            }
          }
        }
      }

      // Parse ingredients if JSON string
      const parsedIngredients =
        typeof ingredients === "string" ? JSON.parse(ingredients) : ingredients;

      // Apply updates (only overwrite if provided)
      if (title) recipe.title = title;
      if (cookingTime) recipe.cookingTime = cookingTime;
      if (dishType) recipe.dishType = dishType;
      if (parsedIngredients) recipe.ingredients = parsedIngredients;
      if (instructions) recipe.instructions = instructions;
      recipe.coverImage = newCoverUrl;
      recipe.coverImagePublicId = newPublicId; // keep/attach public_id for future deletes

      const updated = await recipe.save();
      const populated = await Recipe.findById(updated._id).populate(
        "author",
        "name avatar _id"
      );

      res.status(200).json({
        message: "Recipe updated successfully",
        recipe: populated,
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

// Remix a recipe
router.post(
  "/:id/remix",
  authMiddleware,
  upload.single("coverImage"),
  async (req, res) => {
    try {
      const parentId = req.params.id;
      const {
        title,
        cookingTime,
        dishType,
        ingredients,
        instructions,
        remixNote,
      } = req.body;

      if (!title || !ingredients || !instructions) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // 1) Fetch parent recipe
      const parentDoc = await Recipe.findById(parentId);
      if (!parentDoc) {
        return res.status(404).json({ message: "Parent recipe not found" });
      }

      // 2) Handle image
      let coverImage, coverImagePublicId;

      if (req.file) {
        // user provided new image
        const uploadInfo = await processAndUploadRecipeImage(req.file);
        coverImage = uploadInfo.coverImage;
        coverImagePublicId = uploadInfo.coverImagePublicId;
      } else {
        // reuse parent image
        coverImage = parentDoc.coverImage;
        coverImagePublicId = parentDoc.coverImagePublicId;
      }

      // 3) Parse ingredients
      const parsedIngredients =
        typeof ingredients === "string" ? JSON.parse(ingredients) : ingredients;

      // 4) Create remix recipe
      const remixDepth = (parentDoc.remixDepth || 0) + 1;

      const remixRecipe = await Recipe.create({
        title,
        author: req.user.id,
        coverImage,
        coverImagePublicId,
        cookingTime,
        dishType,
        ingredients: parsedIngredients,
        instructions,
        parentRecipe: parentDoc._id,
        remixDepth,
        remixNote: remixNote || "",
      });

      // 5) Update parent remixCount
      await Recipe.findByIdAndUpdate(parentDoc._id, {
        $inc: { remixCount: 1 },
      });

      // 6) Optional notification
      if (String(parentDoc.author) !== String(req.user.id)) {
        await Notification.create({
          recipient: parentDoc.author,
          sender: req.user.id,
          type: "remix",
          recipe: remixRecipe._id,
          parentRecipe: parentDoc._id,
        });
      }

      return res
        .status(201)
        .json({ message: "Remix created successfully", recipe: remixRecipe });
    } catch (error) {
      console.error("Error creating remix:", error);
      return res
        .status(500)
        .json({ message: "Server error", error: error.message });
    }
  }
);

export default router;
