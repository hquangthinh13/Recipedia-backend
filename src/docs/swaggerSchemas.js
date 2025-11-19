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
 *           description: Recipes that the user has favorited
 *           items:
 *             type: string
 *             description: Recipe ID
 *         following:
 *           type: array
 *           description: Users that this user follows
 *           items:
 *             type: string
 *             description: User ID
 *         followingCount:
 *           type: number
 *           description: Number of users this user is following
 *         followers:
 *           type: array
 *           description: Users who follow this user
 *           items:
 *             type: string
 *             description: User ID
 *         followersCount:
 *           type: number
 *           description: Number of followers this user has
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       example:
 *         id: "64aef3e512345abc67890"
 *         name: "Huynh Quang Thinh"
 *         email: "22521407@gm.uit.edu.vn"
 *         password: "uit2025"
 *         role: "user"
 *         avatar: "https://example.com/avatar.jpg"
 *         isVerified: false
 *         favorites: ["64f1234abcde5678f901"]
 *         following: []
 *         followingCount: 0
 *         followers: []
 *         followersCount: 0
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
 *           minimum: 0
 *           description: Quantity of the ingredient
 *         measurement:
 *           type: string
 *           description: Measurement unit (e.g., grams, cups)
 *       example:
 *         name: "Spaghetti"
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
 *           description: Comment creation time
 *       example:
 *         user: "64aef3e512345abc67890"
 *         text: "Looks delicious!"
 *         createdAt: "2025-11-03T09:15:00.000Z"
 *
 *     Recipe:
 *       type: object
 *       required:
 *         - title
 *         - author
 *         - coverImage
 *         - cookingTime
 *         - dishType
 *         - ingredients
 *         - instructions
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated ID of the recipe
 *         title:
 *           type: string
 *           description: Title of the recipe
 *         author:
 *           type: string
 *           description: ID of the recipe author (User)
 *         coverImage:
 *           type: string
 *           description: URL of the recipe cover image
 *         coverImagePublicId:
 *           type: string
 *           description: Public ID of the image stored on Cloudinary
 *         cookingTime:
 *           type: string
 *           enum: [quick, medium, long, veryLong]
 *           default: medium
 *           description: Approximate cooking time
 *         dishType:
 *           type: string
 *           enum: [starter, main, side, dessert, drink]
 *           description: Type of dish
 *         ingredients:
 *           type: array
 *           description: List of ingredients
 *           items:
 *             $ref: '#/components/schemas/Ingredient'
 *         instructions:
 *           type: string
 *           description: Step-by-step cooking instructions
 *         likes:
 *           type: array
 *           description: Users who liked this recipe
 *           items:
 *             type: string
 *             description: User ID
 *         comments:
 *           type: array
 *           description: Comments on this recipe
 *           items:
 *             $ref: '#/components/schemas/Comment'
 *         likeCount:
 *           type: number
 *           description: Number of likes on this recipe
 *         parentRecipe:
 *           type: string
 *           nullable: true
 *           description: ID of the parent recipe if this is a remix
 *         remixCount:
 *           type: number
 *           description: Number of remixes created from this recipe
 *         remixDepth:
 *           type: number
 *           description: Depth level in the remix chain
 *         remixNote:
 *           type: string
 *           description: Note about how this recipe was remixed
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       example:
 *         id: "64f1234567abcde89012"
 *         title: "Spaghetti Carbonara Remix"
 *         author: "64aef3e512345abc67890"
 *         coverImage: "https://example.com/spaghetti-carbonara.jpg"
 *         coverImagePublicId: "recipes/spaghetti-carbonara-1"
 *         cookingTime: "medium"
 *         dishType: "main"
 *         ingredients:
 *           - name: "Spaghetti"
 *             amount: 200
 *             measurement: "grams"
 *           - name: "Eggs"
 *             amount: 3
 *             measurement: "pieces"
 *         instructions: "Boil pasta, cook pancetta, mix with eggs and cheese off the heat."
 *         likes: ["64faaa123bbb456ccc789"]
 *         likeCount: 1
 *         parentRecipe: null
 *         remixCount: 0
 *         remixDepth: 0
 *         remixNote: "Original version by Huynh Quang Thinh"
 *         createdAt: "2025-11-03T08:00:00.000Z"
 *         updatedAt: "2025-11-03T09:00:00.000Z"
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
 *           description: Auto-generated ID of the notification
 *         recipient:
 *           type: string
 *           description: User ID who receives the notification
 *         sender:
 *           type: string
 *           description: User ID who triggered the notification
 *         type:
 *           type: string
 *           enum: [like, comment, follow, remix]
 *           description: Type of notification
 *         recipe:
 *           type: string
 *           nullable: true
 *           description: Related recipe ID, if applicable
 *         parentRecipe:
 *           type: string
 *           nullable: true
 *           description: Parent recipe ID for remix-related notifications
 *         commentText:
 *           type: string
 *           description: Comment content for comment notifications
 *         isRead:
 *           type: boolean
 *           default: false
 *           description: Whether the notification has been read
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       example:
 *         id: "64faaa123bbb456ccc789"
 *         recipient: "64aef3e512345abc67890"
 *         sender: "64f0987654defabc3210"
 *         type: "like"
 *         recipe: "64f6543210abcde98765"
 *         parentRecipe: null
 *         commentText: null
 *         isRead: false
 *         createdAt: "2025-11-03T08:00:00.000Z"
 *         updatedAt: "2025-11-03T08:30:00.000Z"
 */
