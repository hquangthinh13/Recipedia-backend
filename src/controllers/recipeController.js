import sharp from "sharp";
import streamifier from "streamifier";
import User from "../models/User.js";
import Recipe from "../models/Recipe.js";
import Notification from "../models/Notification.js";
import cloudinary from "../config/cloudinary.js";
import { processAndUploadRecipeImage } from "../util/imageUpload.js";

/**
 * GET /api/recipes
 * Optional query: cookingTime, dishType, sort, page, limit
 */
export const getAllRecipes = async (req, res) => {
  try {
    const { cookingTime, dishType, sort, q } = req.query;

    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const skip = (page - 1) * limit;

    const filter = {};

    // --- TITLE SEARCH ONLY ---
    if (q && q.trim() !== "") {
      filter.title = { $regex: new RegExp(q.trim(), "i") };
    }

    if (cookingTime) filter.cookingTime = cookingTime;
    if (dishType) filter.dishType = dishType;

    let query = Recipe.find(filter)
      .populate("author", "name email avatar")
      .populate("likes", "_id");

    if (sort === "newest") query = query.sort({ createdAt: -1 });
    else if (sort === "oldest") query = query.sort({ createdAt: 1 });
    else if (sort === "liked") query = query.sort({ likeCount: -1 });
    else query = query.sort({ createdAt: -1 });

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
};

/**
 * GET /api/recipes/trending
 */
export const getTrendingRecipes = async (req, res) => {
  try {
    const n = parseInt(req.query.n, 10) || 10;
    const now = new Date();

    const recipes = await Recipe.find({})
      .populate("author", "name avatar")
      .lean();

    const trending = recipes
      .map((recipe) => {
        const likeCount = recipe.likeCount || 0;
        const commentCount = recipe.comments?.length || 0;

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
};

/**
 * POST /api/recipes
 */
export const createRecipe = async (req, res) => {
  try {
    const { title, cookingTime, dishType, ingredients, instructions } =
      req.body;
    if (!title || !ingredients || !instructions) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const uploadInfo = await processAndUploadRecipeImage(req.file);

    const parsedIngredients =
      typeof ingredients === "string" ? JSON.parse(ingredients) : ingredients;

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
};

/**
 * GET /api/recipes/:id
 */
export const getRecipeById = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id)
      .populate("author", "name email avatar")
      .populate({
        path: "parentRecipe",
        select:
          "title coverImage author remixCount createdAt dishType cookingTime likeCount comments parentRecipe",
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
};
/**
 * GET /api/recipes/:id/remixes
 * Query params:
 *   page  – page number (default 1)
 *   limit – items per page (default 10)
 */
export const getRecipeRemixes = async (req, res) => {
  try {
    const { id } = req.params;

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
    const skip = (page - 1) * limit;

    const filter = { parentRecipe: id };

    const [remixes, total] = await Promise.all([
      Recipe.find(filter)
        .sort({ createdAt: -1 }) // newest remixes first
        .skip(skip)
        .limit(limit)
        .populate("author", "name email avatar")
        .select(
          "title coverImage author remixCount remixDepth remixNote createdAt dishType cookingTime likeCount comments parentRecipe"
        ),
      Recipe.countDocuments(filter),
    ]);

    return res.json({
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      recipes: remixes || [], // will be [] when no children
    });
  } catch (error) {
    console.error("Get recipe remixes failed:", error);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/recipes/:id/comments?page=&limit=&sort=
 */
export const getRecipeComments = async (req, res) => {
  try {
    const recipeId = req.params.id;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
    const sort = req.query.sort === "oldest" ? "oldest" : "newest";

    const recipe = await Recipe.findById(recipeId).select("comments").lean();
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });

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
      user: userMap[c.user?.toString()] || c.user,
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
};

/**
 * POST /api/recipes/:id/comments
 */
export const addComment = async (req, res) => {
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

    const newComment = {
      user: userId,
      text: text.trim(),
      createdAt: new Date(),
    };

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

    const populatedRecipe = await recipe.populate({
      path: "comments.user",
      select: "name avatar",
    });

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
};

/**
 * DELETE /api/recipes/:id/comments/:commentId
 */
export const deleteComment = async (req, res) => {
  try {
    const { id: recipeId, commentId } = req.params;
    const userId = req.user.id;

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });

    const target = recipe.comments.id(commentId);
    if (!target) return res.status(404).json({ message: "Comment not found" });

    if (String(target.user) !== String(userId)) {
      return res
        .status(403)
        .json({ message: "Not allowed to delete this comment" });
    }

    target.deleteOne();
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
};

/**
 * DELETE /api/recipes/:id
 */
export const deleteRecipe = async (req, res) => {
  try {
    const recipeId = req.params.id;
    const userId = req.user.id;

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });

    if (String(recipe.author) !== String(userId)) {
      return res
        .status(403)
        .json({ message: "Not allowed to delete this recipe" });
    }

    if (recipe.parentRecipe) {
      try {
        await Recipe.updateOne(
          {
            _id: recipe.parentRecipe,
            remixCount: { $gt: 0 },
          },
          {
            $inc: { remixCount: -1 },
          }
        );
      } catch (e) {
        console.error("Failed to decrement parent remixCount:", e);
      }
    }

    if (recipe.coverImagePublicId) {
      try {
        await cloudinary.uploader.destroy(recipe.coverImagePublicId, {
          resource_type: "image",
          invalidate: true,
        });
      } catch (e) {
        console.error("Cloudinary destroy failed:", e);
      }
    } else if (recipe.coverImage) {
      const match = recipe.coverImage.match(
        /\/upload\/(?:v\d+\/)?(.+?)\.(?:jpg|jpeg|png|gif|webp|svg)$/i
      );
      const derivedPublicId = match?.[1];
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

    await recipe.deleteOne();

    return res.json({ message: "Recipe deleted successfully", recipeId });
  } catch (error) {
    console.error("Delete recipe failed:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * PUT /api/recipes/:id
 */
export const updateRecipe = async (req, res) => {
  try {
    const recipeId = req.params.id;
    const userId = req.user.id;

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });

    if (String(recipe.author) !== String(userId)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { title, cookingTime, dishType, ingredients, instructions } =
      req.body;

    let newCoverUrl = recipe.coverImage;
    let newPublicId = recipe.coverImagePublicId;

    if (req.file) {
      const imageBuffer = await sharp(req.file.buffer)
        .resize({ width: 1280, height: 720, fit: "cover" })
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toBuffer();

      if (recipe.coverImagePublicId) {
        const uploadStream = () =>
          new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                public_id: recipe.coverImagePublicId,
                overwrite: true,
                invalidate: true,
                resource_type: "image",
                folder: undefined,
                format: "jpeg",
              },
              (error, result) => (error ? reject(error) : resolve(result))
            );
            streamifier.createReadStream(imageBuffer).pipe(stream);
          });

        const result = await uploadStream();
        newCoverUrl = result.secure_url;
        newPublicId = result.public_id;
      } else {
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

        if (recipe.coverImage) {
          const match = recipe.coverImage.match(
            /\/upload\/(?:v\d+\/)?(.+?)\.(?:jpg|jpeg|png|gif|webp|svg)$/i
          );
          const oldPublicId = match?.[1];
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

    const parsedIngredients =
      typeof ingredients === "string" ? JSON.parse(ingredients) : ingredients;

    if (title) recipe.title = title;
    if (cookingTime) recipe.cookingTime = cookingTime;
    if (dishType) recipe.dishType = dishType;
    if (parsedIngredients) recipe.ingredients = parsedIngredients;
    if (instructions) recipe.instructions = instructions;
    recipe.coverImage = newCoverUrl;
    recipe.coverImagePublicId = newPublicId;

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
};

/**
 * POST /api/recipes/:id/like
 */
export const toggleLike = async (req, res) => {
  try {
    const recipeId = req.params.id;
    const userId = req.user.id;

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    const alreadyLiked = recipe.likes.includes(userId);

    if (alreadyLiked) {
      recipe.likes = recipe.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      recipe.likes.push(userId);
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
};

/**
 * POST /api/recipes/:id/favorite
 */
export const toggleFavorite = async (req, res) => {
  try {
    const recipeId = req.params.id;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    const alreadyFavorited = user.favorites.includes(recipeId);

    if (alreadyFavorited) {
      user.favorites = user.favorites.filter(
        (id) => id.toString() !== recipeId.toString()
      );
    } else {
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
};

/**
 * POST /api/recipes/:id/remix
 */
export const remixRecipe = async (req, res) => {
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

    const parentDoc = await Recipe.findById(parentId);
    if (!parentDoc) {
      return res.status(404).json({ message: "Parent recipe not found" });
    }

    let coverImage, coverImagePublicId;

    if (req.file) {
      const uploadInfo = await processAndUploadRecipeImage(req.file);
      coverImage = uploadInfo.coverImage;
      coverImagePublicId = uploadInfo.coverImagePublicId;
    } else {
      coverImage = parentDoc.coverImage;
      coverImagePublicId = parentDoc.coverImagePublicId;
    }

    const parsedIngredients =
      typeof ingredients === "string" ? JSON.parse(ingredients) : ingredients;

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

    await Recipe.findByIdAndUpdate(parentDoc._id, {
      $inc: { remixCount: 1 },
    });

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
};
// GET /api/recipes/suggest?q=keyword
export const suggestIngredientsAndTitles = async (req, res) => {
  try {
    const q = req.query.q?.trim();
    if (!q || q.length < 2) {
      return res.json({ suggestions: [] });
    }

    const regex = new RegExp(q, "i");

    // First, find all recipes where either the title OR an ingredient matches
    const recipes = await Recipe.find({
      $or: [
        { title: { $regex: regex } },
        { "ingredients.name": { $regex: regex } },
      ],
    })
      .select("title ingredients")
      .lean();

    if (!recipes.length) {
      return res.json({ suggestions: [] });
    }

    // Recipes where the INGREDIENT name matches q
    const ingredientMatchedRecipes = recipes.filter((recipe) =>
      (recipe.ingredients || []).some((ing) => regex.test(ing.name))
    );

    // If we found any ingredient matches, ONLY use those recipes.
    // Otherwise, fall back to title matches (the full `recipes` list).
    const effectiveRecipes =
      ingredientMatchedRecipes.length > 0 ? ingredientMatchedRecipes : recipes;

    const titlesSet = new Set();
    effectiveRecipes.forEach((r) => {
      if (r.title) titlesSet.add(r.title);
    });

    return res.json({
      suggestions: Array.from(titlesSet).slice(0, 10), // just recipe titles
    });
  } catch (err) {
    console.error("Suggestion error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
