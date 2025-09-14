import mongoose from "mongoose";

// const recipeSchema = new mongoose.Schema({
//     title: { type: String, required: true },
//     instructions: { type: String, required: true },
//     }, 
//     {timestamps: true} // automatically adds createdAt and updatedAt fields
// );

// const Recipe = mongoose.model("Recipe", recipeSchema);

// export default Recipe;
const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now }
});

const recipeSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  coverImage: { type: String }, // could store URL/path
  cookingTime: { type: String }, // e.g. "30 mins", "1 hour"
  dishType: { type: String }, // e.g. "Dessert", "Main course"
  ingredients: [{ type: String, trim: true }], // list of ingredients (tags)
  instructions: { type: String, required: true }, // full cooking instructions
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [commentSchema],
}, { timestamps: true }); // includes createdAt + updatedAt

export default mongoose.model("Recipe", recipeSchema);
