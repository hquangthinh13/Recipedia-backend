/**
 * @swagger
 * tags:
 *   name: Recipes
 *   description: Recipe browsing, creation, remixing, likes, comments, and favorites
 *
 * /api/recipes:
 *   get:
 *     summary: Get all recipes with optional filters and pagination
 *     tags: [Recipes]
 *     parameters:
 *       - in: query
 *         name: cookingTime
 *         schema:
 *           type: string
 *           enum: [quick, medium, long, veryLong]
 *         description: Filter by cooking time
 *       - in: query
 *         name: dishType
 *         schema:
 *           type: string
 *           enum: [starter, main, side, dessert, drink]
 *         description: Filter by dish type
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, oldest, liked]
 *         description: Sort recipes (default newest)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of recipes per page (max 100)
 *     responses:
 *       200:
 *         description: List of recipes
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
 *                         description: Whether the current user liked this recipe
 *       500:
 *         description: Server error
 *
 *   post:
 *     summary: Create a new recipe (with image upload)
 *     tags: [Recipes]
 *     consumes:
 *       - multipart/form-data
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
 *               - cookingTime
 *               - dishType
 *               - coverImage
 *             properties:
 *               title:
 *                 type: string
 *                 description: Recipe title
 *               cookingTime:
 *                 type: string
 *                 enum: [quick, medium, long, veryLong]
 *               dishType:
 *                 type: string
 *                 enum: [starter, main, side, dessert, drink]
 *               ingredients:
 *                 type: string
 *                 description: JSON string of Ingredient[] (array of ingredients)
 *                 example: '[{"name":"Spaghetti","amount":200,"measurement":"grams"},{"name":"Eggs","amount":3,"measurement":"pieces"}]'
 *               instructions:
 *                 type: string
 *                 description: Cooking instructions
 *               coverImage:
 *                 type: string
 *                 format: binary
 *                 description: Recipe cover image file
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
 *       500:
 *         description: Server error
 *
 * /api/recipes/trending:
 *   get:
 *     summary: Get top trending recipes based on likes, comments, and recency
 *     tags: [Recipes]
 *     parameters:
 *       - in: query
 *         name: n
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *         description: Number of recipes to return
 *     responses:
 *       200:
 *         description: Trending recipes
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
 *                       trendScore:
 *                         type: number
 *       500:
 *         description: Server error
 *
 * /api/recipes/{id}:
 *   get:
 *     summary: Get a recipe by ID (including its parent recipe, if any)
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Recipe ID
 *     responses:
 *       200:
 *         description: Recipe found
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Recipe'
 *                 - type: object
 *                   properties:
 *                     parentRecipe:
 *                       $ref: '#/components/schemas/Recipe'
 *       404:
 *         description: Recipe not found
 *       500:
 *         description: Server error
 *
 *   delete:
 *     summary: Delete a recipe (only owner)
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Recipe ID
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
 *       403:
 *         description: Not allowed to delete this recipe
 *       404:
 *         description: Recipe not found
 *       500:
 *         description: Server error
 *
 *   put:
 *     summary: Update a recipe (only owner, optional new image)
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Recipe ID
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               cookingTime:
 *                 type: string
 *                 enum: [quick, medium, long, veryLong]
 *               dishType:
 *                 type: string
 *                 enum: [starter, main, side, dessert, drink]
 *               ingredients:
 *                 type: string
 *                 description: JSON string of Ingredient[]
 *               instructions:
 *                 type: string
 *               coverImage:
 *                 type: string
 *                 format: binary
 *                 description: New cover image file
 *           encoding:
 *             ingredients:
 *               contentType: application/json
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
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Recipe not found
 *       500:
 *         description: Server error
 *
 * /api/recipes/{id}/comments:
 *   get:
 *     summary: Get paginated comments for a recipe
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Recipe ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number (default 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Comments per page (default 10, max 100)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, oldest]
 *         description: Sort comments by newest or oldest (default newest)
 *     responses:
 *       200:
 *         description: Paginated comments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 comments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Comment'
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 totalCount:
 *                   type: integer
 *                 sort:
 *                   type: string
 *       404:
 *         description: Recipe not found
 *       500:
 *         description: Server error
 *
 *   post:
 *     summary: Add a comment to a recipe
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Recipe ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text:
 *                 type: string
 *           example:
 *             text: "This looks amazing, thanks for sharing!"
 *     responses:
 *       201:
 *         description: Comment added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Comment added successfully.
 *                 comment:
 *                   $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Comment text is required
 *       404:
 *         description: Recipe not found
 *       500:
 *         description: Server error
 *
 * /api/recipes/{id}/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment (only comment owner)
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Recipe ID
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Comment deleted
 *                 commentId:
 *                   type: string
 *                 totalCount:
 *                   type: integer
 *       403:
 *         description: Not allowed to delete this comment
 *       404:
 *         description: Recipe or comment not found
 *       500:
 *         description: Server error
 *
 * /api/recipes/{id}/like:
 *   post:
 *     summary: Like or unlike a recipe
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Recipe ID
 *     responses:
 *       200:
 *         description: Recipe liked or unliked
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Recipe liked
 *                 likesCount:
 *                   type: integer
 *                 likedByUser:
 *                   type: boolean
 *       404:
 *         description: Recipe not found
 *       500:
 *         description: Server error
 *
 * /api/recipes/{id}/favorite:
 *   post:
 *     summary: Add or remove a recipe from the current user's favorites
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Recipe ID
 *     responses:
 *       200:
 *         description: Favorite toggled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Recipe added to favorites
 *                 favorites:
 *                   type: array
 *                   items:
 *                     type: string
 *                 isFavorite:
 *                   type: boolean
 *       404:
 *         description: User or recipe not found
 *       500:
 *         description: Server error
 *
 * /api/recipes/{id}/remix:
 *   post:
 *     summary: Create a remix of an existing recipe
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Parent recipe ID
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
 *               cookingTime:
 *                 type: string
 *                 enum: [quick, medium, long, veryLong]
 *               dishType:
 *                 type: string
 *                 enum: [starter, main, side, dessert, drink]
 *               ingredients:
 *                 type: string
 *                 description: JSON string of Ingredient[]
 *               instructions:
 *                 type: string
 *               remixNote:
 *                 type: string
 *                 description: Note explaining how this recipe is remixed
 *               coverImage:
 *                 type: string
 *                 format: binary
 *                 description: Optional new cover image; if omitted, parent image is reused
 *           encoding:
 *             ingredients:
 *               contentType: application/json
 *     responses:
 *       201:
 *         description: Remix created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Remix created successfully
 *                 recipe:
 *                   $ref: '#/components/schemas/Recipe'
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Parent recipe not found
 *       500:
 *         description: Server error
 */
