import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
});

const ingredientSchema = new mongoose.Schema({
  name: { type: String, trim: true, required: true },
  amount: { type: Number, required: true },
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
    coverImage: { type: String }, // URL
    cookingTime: {
      type: String,
      enum: ["quick", "medium", "long", "veryLong"],
      default: "medium",
    },
    dishType: {
      type: String,
      enum: ["starter", "main", "side", "dessert", "drink"],
    },
    ingredients: { type: [ingredientSchema], required: true },
    instructions: { type: String, required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [commentSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Recipe", recipeSchema);
