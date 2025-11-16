import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
});

const ingredientSchema = new mongoose.Schema({
  name: { type: String, trim: true, required: true },
  amount: { type: Number, required: true, min: 0 },
  measurement: { type: String, trim: true },
});

const recipeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    coverImage: { type: String, required: true },
    coverImagePublicId: { type: String },
    cookingTime: {
      type: String,
      enum: ["quick", "medium", "long", "veryLong"],
      default: "medium",
      required: true,
    },
    dishType: {
      type: String,
      enum: ["starter", "main", "side", "dessert", "drink"],
      required: true,
    },
    ingredients: { type: [ingredientSchema], required: true },
    instructions: { type: String, required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [commentSchema],
    likeCount: { type: Number, default: 0 },

    parentRecipe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipe",
      default: null,
      index: true,
    },
    remixCount: {
      type: Number,
      default: 0,
    },
    remixDepth: {
      type: Number,
      default: 0,
    },
    remixNote: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);
recipeSchema.pre("save", function (next) {
  this.likeCount = this.likes.length;
  next();
});

export default mongoose.model("Recipe", recipeSchema);
