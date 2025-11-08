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

/**
 * @swagger
 * /api/recipes:
 *   get:
 *     summary: Get all recipes with optional filters, sorting, and pagination
 *     tags: [Recipes]
 *     description: Retrieve a list of recipes. Supports filtering by `cookingTime` and `dishType`, sorting by newest, oldest, or most liked, and paginated results.
 *     parameters:
 *       - in: query
 *         name: cookingTime
 *         schema:
 *           type: string
 *           enum: [quick, medium, long, veryLong]
 *         description: Filter recipes by cooking time
 *       - in: query
 *         name: dishType
 *         schema:
 *           type: string
 *           enum: [starter, main, side, dessert, drink]
 *         description: Filter recipes by dish type
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, oldest, liked]
 *         description: Sort recipes by creation date or number of likes
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination (default 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of results per page (max 100)
 *     responses:
 *       200:
 *         description: Successfully retrieved recipes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/Recipe'
 *                   - type: object
 *                     properties:
 *                       likedByUser:
 *                         type: boolean
 *                         description: Whether the currently logged-in user liked this recipe
 *         examples:
 *           application/json:
 *             summary: Example response
 *             value:
 *               - id: "64f1234567abcde89012"
 *                 title: "Spaghetti Carbonara"
 *                 author:
 *                   name: "John Doe"
 *                   email: "john@example.com"
 *                   avatar: "https://example.com/avatar.jpg"
 *                 cookingTime: "medium"
 *                 dishType: "main"
 *                 ingredients:
 *                   - name: "Spaghetti"
 *                     amount: 200
 *                     measurement: "grams"
 *                 instructions: "Boil pasta and cook pancetta, then mix with eggs and cheese."
 *                 likeCount: 15
 *                 likedByUser: true
 *                 createdAt: "2025-11-03T09:15:00.000Z"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */

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
/**
 * @swagger
 * /api/recipes/trending:
 *   get:
 *     summary: Get top trending recipes based on likes, comments, and recency
 *     tags: [Recipes]
 *     description: >
 *       Returns the top trending recipes calculated from a dynamic **trend score** that factors in:
 *       - Number of likes
 *       - Number of comments
 *       - How recent the recipe is (recipes created within the past 7 days get a recency boost)
 *
 *       Recipes are sorted by this computed trend score, and the top `n` results are returned.
 *     parameters:
 *       - in: query
 *         name: n
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of top trending recipes to return (default is 10)
 *     responses:
 *       200:
 *         description: Successfully retrieved trending recipes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/Recipe'
 *                   - type: object
 *                     properties:
 *                       commentCount:
 *                         type: integer
 *                         description: Number of comments on the recipe
 *                       trendScore:
 *                         type: number
 *                         description: Computed trend score based on likes, comments, and recency
 *         examples:
 *           application/json:
 *             summary: Example response
 *             value:
 *               - id: "64f1234567abcde89012"
 *                 title: "Mango Smoothie"
 *                 author:
 *                   name: "Alice Nguyen"
 *                   avatar: "https://example.com/avatars/alice.png"
 *                 cookingTime: "quick"
 *                 dishType: "drink"
 *                 likeCount: 20
 *                 commentCount: 5
 *                 trendScore: 52.5
 *                 createdAt: "2025-11-02T09:00:00.000Z"
 *               - id: "64f9876543abcde21098"
 *                 title: "Spaghetti Carbonara"
 *                 author:
 *                   name: "John Doe"
 *                   avatar: "https://example.com/avatars/john.png"
 *                 cookingTime: "medium"
 *                 dishType: "main"
 *                 likeCount: 18
 *                 commentCount: 3
 *                 trendScore: 47.0
 *                 createdAt: "2025-10-29T14:30:00.000Z"
 *       500:
 *         description: Server error while computing trending recipes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server error"
 *                 error:
 *                   type: string
 *                   example: "Cannot read properties of undefined"
 */

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

/**
 * @swagger
 * /api/recipes:
 *   post:
 *     summary: Create a new recipe (with image upload and details)
 *     tags: [Recipes]
 *     description: >
 *       Creates a new recipe with title, ingredients, instructions, and an optional cover image.
 *       The endpoint requires authentication (via `authMiddleware`) and processes the uploaded image using **Sharp** before storing it on **Cloudinary**.
 *
 *       The request must use `multipart/form-data` with fields for the recipe details and the image file.
 *     security:
 *       - bearerAuth: []    # Requires JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - ingredients
 *               - instructions
 *               - coverImage
 *             properties:
 *               title:
 *                 type: string
 *                 description: Recipe title
 *                 example: "Chocolate Cake"
 *               cookingTime:
 *                 type: string
 *                 enum: [quick, medium, long, veryLong]
 *                 description: Estimated cooking time
 *                 example: "long"
 *               dishType:
 *                 type: string
 *                 enum: [starter, main, side, dessert, drink]
 *                 description: Type of dish
 *                 example: "dessert"
 *               ingredients:
 *                 type: string
 *                 description: >
 *                   JSON string representing an array of ingredients.
 *                   Example:
 *                   `[{"name": "Flour", "amount": 200, "measurement": "grams"}, {"name": "Eggs", "amount": 3}]`
 *               instructions:
 *                 type: string
 *                 description: Step-by-step instructions for preparing the recipe
 *                 example: "Mix ingredients and bake for 30 minutes at 180°C."
 *               coverImage:
 *                 type: string
 *                 format: binary
 *                 description: Image file for the recipe cover (JPEG or PNG)
 *     responses:
 *       201:
 *         description: Recipe successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Recipe created successfully"
 *                 recipe:
 *                   $ref: '#/components/schemas/Recipe'
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Missing required fields"
 *       500:
 *         description: Server or Cloudinary upload error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server error"
 *                 error:
 *                   type: string
 *                   example: "Cloudinary upload failed"
 */

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
/**
 * @swagger
 * /api/recipes/{id}:
 *   get:
 *     summary: Get a recipe by ID
 *     description: Returns a single recipe. The `author` field is populated with `name`, `email`, and `avatar`.
 *     tags:
 *       - Recipes
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: MongoDB ObjectId of the recipe
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Recipe found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   example: "690579f42359bf1739600adf"
 *                 title:
 *                   type: string
 *                   example: "Spaghetti Bolognese"
 *                 description:
 *                   type: string
 *                   example: "A hearty Italian classic with a rich meat sauce."
 *                 ingredients:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                     - "200g spaghetti"
 *                     - "150g minced beef"
 *                     - "1 cup tomato sauce"
 *                 steps:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                     - "Boil pasta until al dente."
 *                     - "Brown the beef."
 *                     - "Add sauce and simmer."
 *                 coverImage:
 *                   type: string
 *                   format: uri
 *                   example: "https://example.com/images/spaghetti.jpg"
 *                 author:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "John Doe"
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: "john@example.com"
 *                     avatar:
 *                       type: string
 *                       format: uri
 *                       example: "https://api.dicebear.com/9.x/micah/svg?seed=John%20Doe"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-10-02T12:34:56.789Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-10-03T09:21:00.123Z"
 *       404:
 *         description: Recipe not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Recipe not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server error"
 */

// Get recipe by ID
router.get("/:id", async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id).populate(
      "author",
      "name email avatar"
    );
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
/**
 * @swagger
 * /api/recipes/{id}/comments:
 *   get:
 *     summary: Get paginated comments for a recipe
 *     description: >
 *       Returns a paginated list of comments for the specified recipe.
 *       Supports sorting by newest (default) or oldest. Each comment's `user`
 *       is "manually populated" with `name` and `avatar`.
 *     tags:
 *       - Recipes
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: MongoDB ObjectId of the recipe
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         required: false
 *         description: Page number (1-based). Minimum is 1.
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         required: false
 *         description: Number of comments per page (max 100).
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: sort
 *         required: false
 *         description: Sort order by creation time.
 *         schema:
 *           type: string
 *           enum: [newest, oldest]
 *           default: newest
 *     responses:
 *       200:
 *         description: Paginated comments returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 comments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "671234abcd9012ef34567890"
 *                       text:
 *                         type: string
 *                         example: "This recipe is amazing!"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-11-08T03:21:45.000Z"
 *                       user:
 *                         type: object
 *                         description: Populated user subset
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "66ff00aa11bb22cc33dd44ee"
 *                           name:
 *                             type: string
 *                             example: "Jane Doe"
 *                           avatar:
 *                             type: string
 *                             format: uri
 *                             example: "https://api.dicebear.com/9.x/micah/svg?seed=Jane%20Doe"
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 totalPages:
 *                   type: integer
 *                   example: 3
 *                 totalCount:
 *                   type: integer
 *                   example: 24
 *                 sort:
 *                   type: string
 *                   enum: [newest, oldest]
 *                   example: "newest"
 *       404:
 *         description: Recipe not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Recipe not found"
 *       500:
 *         description: Server error while fetching comments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server error"
 *                 error:
 *                   type: string
 *                   example: "Error message details"
 */

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
/**
 * @swagger
 * /api/recipes/{id}/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment from a recipe
 *     description: >
 *       Deletes a specific comment from a recipe.
 *       This action requires authentication and is only permitted if the authenticated user is the author of the comment.
 *     tags:
 *       - Recipes
 *     security:
 *       - bearerAuth: []   # Requires JWT authentication
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: MongoDB ObjectId of the recipe
 *         schema:
 *           type: string
 *           example: "671234abcd9012ef34567890"
 *       - in: path
 *         name: commentId
 *         required: true
 *         description: MongoDB ObjectId of the comment to delete
 *         schema:
 *           type: string
 *           example: "671234abcd9012ef98765432"
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Comment deleted"
 *                 commentId:
 *                   type: string
 *                   example: "671234abcd9012ef98765432"
 *                 totalCount:
 *                   type: integer
 *                   description: Remaining total number of comments in the recipe
 *                   example: 12
 *       403:
 *         description: Forbidden — user not authorized to delete this comment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Not allowed to delete this comment"
 *       404:
 *         description: Recipe or comment not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Comment not found"
 *       500:
 *         description: Server error while deleting comment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server error"
 *                 error:
 *                   type: string
 *                   example: "Delete comment failed: CastError"
 */

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

/**
 * @swagger
 * /api/recipes/{id}:
 *   put:
 *     summary: Update an existing recipe (with optional new image)
 *     tags: [Recipes]
 *     description: >
 *       Updates a recipe owned by the logged-in user.
 *       Allows updating title, cooking time, dish type, ingredients, instructions, and optionally the cover image.
 *       If a new image is uploaded, it will be processed using **Sharp** and stored on **Cloudinary**.
 *     security:
 *       - bearerAuth: []   # Requires JWT token
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique ID of the recipe to update
 *         example: 6904a98d3c9e55a5d451b910
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Updated recipe title
 *                 example: "Creamy Alfredo Pasta"
 *               cookingTime:
 *                 type: string
 *                 enum: [quick, medium, long, veryLong]
 *                 description: Updated cooking duration
 *                 example: "medium"
 *               dishType:
 *                 type: string
 *                 enum: [starter, main, side, dessert, drink]
 *                 description: Updated dish type
 *                 example: "main"
 *               ingredients:
 *                 type: string
 *                 description: >
 *                   JSON string representing the updated ingredient list.
 *                   Example: `[{"name": "Pasta", "amount": 200, "measurement": "grams"}]`
 *               instructions:
 *                 type: string
 *                 description: Updated cooking instructions
 *                 example: "Boil pasta, prepare sauce, mix and serve hot."
 *               coverImage:
 *                 type: string
 *                 format: binary
 *                 description: Optional new image file for the recipe cover
 *     responses:
 *       200:
 *         description: Recipe successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Recipe updated successfully"
 *                 recipe:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Recipe'
 *                     - type: object
 *                       properties:
 *                         author:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                               example: "John Doe"
 *                             avatar:
 *                               type: string
 *                               example: "https://example.com/avatar.jpg"
 *       400:
 *         description: Bad request or missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Missing required fields"
 *       403:
 *         description: Unauthorized — user does not own the recipe
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized"
 *       404:
 *         description: Recipe not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Recipe not found"
 *       500:
 *         description: Server or Cloudinary error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server error"
 *                 error:
 *                   type: string
 *                   example: "Cloudinary upload failed"
 */

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
/**
 * @swagger
 * /api/recipes/{id}/like:
 *   post:
 *     summary: Like or unlike a recipe
 *     tags: [Recipes]
 *     description: >
 *       Toggles a like on a specific recipe for the authenticated user.
 *       If the recipe is already liked by the user, it will be unliked.
 *       If the recipe is newly liked, a notification is created for the recipe author (unless the author is the liker).
 *     security:
 *       - bearerAuth: []     # Requires JWT authentication
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the recipe to like or unlike
 *         example: 6904a98d3c9e55a5d451b910
 *     responses:
 *       200:
 *         description: Successfully toggled the like status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Recipe liked"
 *                 likesCount:
 *                   type: integer
 *                   description: Total number of likes for the recipe
 *                   example: 42
 *                 likedByUser:
 *                   type: boolean
 *                   description: Whether the current user now likes the recipe
 *                   example: true
 *       401:
 *         description: Unauthorized — missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "No token, authorization denied"
 *       404:
 *         description: Recipe not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Recipe not found"
 *       500:
 *         description: Server error while toggling like status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */

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
/**
 * @swagger
 * /api/recipes/{id}/favorite:
 *   post:
 *     summary: Add or remove a recipe from the user's favorites
 *     tags: [Recipes]
 *     description: >
 *       Toggles whether a recipe is in the authenticated user's list of favorites.
 *       If the recipe is already favorited, this endpoint will remove it.
 *       If it is not, it will be added to the user's favorites list.
 *     security:
 *       - bearerAuth: []    # Requires JWT token
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the recipe to add or remove from favorites
 *         example: 6904a98d3c9e55a5d451b910
 *     responses:
 *       200:
 *         description: Successfully toggled favorite status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Recipe added to favorites"
 *                 favorites:
 *                   type: array
 *                   description: List of recipe IDs currently in the user's favorites
 *                   items:
 *                     type: string
 *                     example: "64f9876543abcde21098"
 *                 isFavorite:
 *                   type: boolean
 *                   description: Whether the recipe is now in the user's favorites
 *                   example: true
 *       401:
 *         description: Unauthorized — user not logged in or token missing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "No token, authorization denied"
 *       404:
 *         description: Recipe or user not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Recipe not found"
 *       500:
 *         description: Server error while updating favorites
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */

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
/**
 * @swagger
 * /api/recipes/{id}/comments:
 *   post:
 *     summary: Add a comment to a recipe
 *     tags: [Recipes]
 *     description: >
 *       Allows an authenticated user to post a comment on a recipe.
 *       A notification is automatically created for the recipe author (unless the commenter is the author).
 *       The endpoint returns the newly added comment with populated user info.
 *     security:
 *       - bearerAuth: []   # Requires JWT token
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the recipe to comment on
 *         example: 64f1234567abcde89012
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: The text content of the comment
 *                 example: "This looks amazing! Can't wait to try it."
 *     responses:
 *       201:
 *         description: Comment successfully added
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Comment added successfully."
 *                 comment:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                           example: "Jane Smith"
 *                         avatar:
 *                           type: string
 *                           example: "https://example.com/avatars/jane.jpg"
 *                     text:
 *                       type: string
 *                       example: "This looks delicious!"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-11-03T12:00:00.000Z"
 *       400:
 *         description: Comment text missing or empty
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Comment text is required."
 *       401:
 *         description: Unauthorized — missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "No token, authorization denied"
 *       404:
 *         description: Recipe not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Recipe not found."
 *       500:
 *         description: Server error while adding comment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server error"
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 */

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
/**
 * @swagger
 * /api/recipes/{id}:
 *   delete:
 *     summary: Delete a recipe
 *     tags: [Recipes]
 *     description: >
 *       Deletes a recipe by its ID.
 *       Only the authenticated user who created the recipe can delete it.
 *       Requires a valid JWT token for authorization.
 *     security:
 *       - bearerAuth: []   # Requires JWT token
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the recipe to delete
 *         example: 64f1234567abcde89012
 *     responses:
 *       200:
 *         description: Recipe successfully deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Recipe deleted successfully"
 *       401:
 *         description: Unauthorized — missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "No token, authorization denied"
 *       403:
 *         description: Forbidden — user is not the author of the recipe
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized"
 *       404:
 *         description: Recipe not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Recipe not found"
 *       500:
 *         description: Server error while deleting recipe
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */

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
