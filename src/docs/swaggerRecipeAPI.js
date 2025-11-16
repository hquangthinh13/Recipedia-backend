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

/**
 * @swagger
 * /api/recipes:
 *   post:
 *     summary: Create a new recipe
 *     description: >
 *       Creates a new recipe entry.
 *       Requires authentication and supports uploading an image file (`coverImage`).
 *       The image is processed with Sharp and stored on Cloudinary.
 *       The Cloudinary public_id is also stored for future management.
 *     tags:
 *       - Recipes
 *     security:
 *       - bearerAuth: []
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
 *             properties:
 *               title:
 *                 type: string
 *                 description: Recipe title
 *                 example: "Garlic Butter Shrimp"
 *               cookingTime:
 *                 type: string
 *                 enum: [quick, medium, long, veryLong]
 *                 example: "quick"
 *               dishType:
 *                 type: string
 *                 enum: [starter, main, side, dessert, drink]
 *                 example: "main"
 *               ingredients:
 *                 oneOf:
 *                   - type: string
 *                     description: >
 *                       JSON string representing an array of ingredients.
 *                       Example: `[{"name":"Eggs","quantity":"2","unit":""}]`
 *                   - type: array
 *                     items:
 *                       $ref: '#/components/schemas/Ingredient'
 *               instructions:
 *                 type: string
 *                 description: Step-by-step cooking instructions
 *                 example: "Melt butter in a pan, add garlic and shrimp..."
 *               coverImage:
 *                 type: string
 *                 format: binary
 *                 description: Optional image file for recipe cover
 *           encoding:
 *             title:
 *               contentType: text/plain
 *             cookingTime:
 *               contentType: text/plain
 *             dishType:
 *               contentType: text/plain
 *             ingredients:
 *               contentType: text/plain
 *             instructions:
 *               contentType: text/plain
 *             coverImage:
 *               contentType: image/jpeg
 *     responses:
 *       201:
 *         description: Recipe created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Recipe created successfully
 *                 recipe:
 *                   $ref: '#/components/schemas/Recipe'
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               missingFields:
 *                 value:
 *                   message: Missing required fields
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               serverError:
 *                 value:
 *                   message: Server error
 *                   error: "Error creating full recipe: ..."
 */

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

/**
 * @swagger
 * /api/recipes/{id}:
 *   delete:
 *     summary: Delete a recipe
 *     description: >
 *       Deletes a recipe owned by the authenticated user.
 *       If the recipe has a Cloudinary image (`coverImagePublicId`), the server will attempt to delete it as well.
 *     tags:
 *       - Recipes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Recipe ID (MongoDB ObjectId)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Recipe deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Recipe deleted successfully
 *                 recipeId:
 *                   type: string
 *                   example: "665aa8c0a9b5b0c9c3779f42"
 *       403:
 *         description: Not allowed to delete this recipe (not the owner)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               forbidden:
 *                 value:
 *                   message: Not allowed to delete this recipe
 *       404:
 *         description: Recipe not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               notFound:
 *                 value:
 *                   message: Recipe not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               serverError:
 *                 value:
 *                   message: Server error
 *                   error: "Delete recipe failed: ..."
 */

/**
 * @swagger
 * /api/recipes/{id}:
 *   put:
 *     summary: Update a recipe
 *     description: >
 *       Updates a recipe owned by the authenticated user.
 *       Accepts optional new cover image (multipart/form-data).
 *       If a new image is uploaded, the server overwrites the existing Cloudinary asset
 *       (when public_id exists) or uploads a new one and deletes the old image.
 *     tags:
 *       - Recipes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Recipe ID (MongoDB ObjectId)
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Recipe title
 *               cookingTime:
 *                 type: string
 *                 enum: [quick, medium, long, veryLong]
 *                 description: Estimated time category
 *               dishType:
 *                 type: string
 *                 enum: [starter, main, side, dessert, drink]
 *                 description: Dish category
 *               ingredients:
 *                 oneOf:
 *                   - type: string
 *                     description: >
 *                       JSON string representing an array of ingredients.
 *                       Example:
 *                       `[{"name":"Eggs","quantity":"2","unit":""}]`
 *                   - type: array
 *                     items:
 *                       $ref: '#/components/schemas/Ingredient'
 *               instructions:
 *                 type: string
 *                 description: Cooking instructions
 *               coverImage:
 *                 type: string
 *                 format: binary
 *                 description: Optional image file to replace the current cover
 *           encoding:
 *             title:
 *               contentType: text/plain
 *             cookingTime:
 *               contentType: text/plain
 *             dishType:
 *               contentType: text/plain
 *             ingredients:
 *               contentType: text/plain
 *             instructions:
 *               contentType: text/plain
 *             coverImage:
 *               contentType: image/jpeg
 *     responses:
 *       200:
 *         description: Recipe updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Recipe updated successfully
 *                 recipe:
 *                   $ref: '#/components/schemas/Recipe'
 *       400:
 *         description: Missing or invalid fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Unauthorized (not the owner)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Recipe not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

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
