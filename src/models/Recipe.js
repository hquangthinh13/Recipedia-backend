import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
});

const IngredientSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  amount: { type: String, trim: true },
});

const recipeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    coverImage: { type: String }, // URL/path
    cookingTime: { type: String },
    dishType: { type: String },
    ingredients: { type: [IngredientSchema], required: true },
    instructions: { type: String, required: true }, // full cooking instructions
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [commentSchema],
  },
  { timestamps: true }
); // includes createdAt + updatedAt

export default mongoose.model("Recipe", recipeSchema);
