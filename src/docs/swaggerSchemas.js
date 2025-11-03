/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated ID of the user
 *         name:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           description: Hashed password
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           default: user
 *         avatar:
 *           type: string
 *           description: URL of the user's avatar
 *         isVerified:
 *           type: boolean
 *           description: Indicates if the user's email is verified
 *         favorites:
 *           type: array
 *           items:
 *             type: string
 *             description: Recipe IDs that the user has favorited
 *         following:
 *           type: array
 *           items:
 *             type: string
 *             description: Users that this user follows
 *         followers:
 *           type: array
 *           items:
 *             type: string
 *             description: Users who follow this user
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       example:
 *         id: "64aef3e512345abc67890"
 *         name: "John Doe"
 *         email: "john@example.com"
 *         role: "user"
 *         avatar: "https://example.com/avatar.jpg"
 *         isVerified: true
 *         favorites: ["64f1234abcde5678f901"]
 *         followersCount: 10
 *         followingCount: 8
 *         createdAt: "2025-10-15T10:45:32.000Z"
 *         updatedAt: "2025-10-20T11:02:10.000Z"
 *
 *     Ingredient:
 *       type: object
 *       required:
 *         - name
 *         - amount
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the ingredient
 *         amount:
 *           type: number
 *           description: Quantity of the ingredient
 *         measurement:
 *           type: string
 *           description: Measurement unit (e.g., grams, cups)
 *       example:
 *         name: "Sugar"
 *         amount: 200
 *         measurement: "grams"
 *
 *     Comment:
 *       type: object
 *       required:
 *         - user
 *         - text
 *       properties:
 *         user:
 *           type: string
 *           description: ID of the user who commented
 *         text:
 *           type: string
 *           description: Comment text
 *         createdAt:
 *           type: string
 *           format: date-time
 *       example:
 *         user: "64f1234567abcde89012"
 *         text: "Looks delicious!"
 *         createdAt: "2025-11-03T09:15:00.000Z"
 *
 *     Recipe:
 *       type: object
 *       required:
 *         - title
 *         - author
 *         - ingredients
 *         - instructions
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         author:
 *           type: string
 *           description: ID of the recipe author
 *         coverImage:
 *           type: string
 *           description: URL of the recipe cover image
 *         cookingTime:
 *           type: string
 *           enum: [quick, medium, long, veryLong]
 *         dishType:
 *           type: string
 *           enum: [starter, main, side, dessert, drink]
 *         ingredients:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Ingredient'
 *         instructions:
 *           type: string
 *         likes:
 *           type: array
 *           items:
 *             type: string
 *         comments:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Comment'
 *         likeCount:
 *           type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *       example:
 *         id: "64f1234567abcde89012"
 *         title: "Spaghetti Carbonara"
 *         author: "64fabcde1234567890"
 *         coverImage: "https://example.com/spaghetti.jpg"
 *         cookingTime: "medium"
 *         dishType: "main"
 *         ingredients:
 *           - name: "Spaghetti"
 *             amount: 200
 *             measurement: "grams"
 *         instructions: "Boil pasta and cook pancetta, then mix with eggs and cheese."
 *         likes: ["64faaa123bbb456ccc789"]
 *         likeCount: 15
 *
 *     Notification:
 *       type: object
 *       required:
 *         - recipient
 *         - sender
 *         - type
 *       properties:
 *         id:
 *           type: string
 *         recipient:
 *           type: string
 *           description: User ID who receives the notification
 *         sender:
 *           type: string
 *           description: User ID who triggered the notification
 *         type:
 *           type: string
 *           enum: [like, comment, follow]
 *         recipe:
 *           type: string
 *           description: Related recipe ID (if applicable)
 *         commentText:
 *           type: string
 *           description: Comment content (for comment notifications)
 *         isRead:
 *           type: boolean
 *           default: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       example:
 *         id: "64faaa123bbb456ccc789"
 *         recipient: "64f1234567abcde89012"
 *         sender: "64f0987654defabc3210"
 *         type: "like"
 *         recipe: "64f6543210abcde98765"
 *         commentText: null
 *         isRead: false
 *         createdAt: "2025-11-03T08:00:00.000Z"
 */
