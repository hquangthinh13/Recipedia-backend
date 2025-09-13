import mongoose from "mongoose";

const recipeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    instructions: { type: String, required: true },
    }, 
    {timestamps: true} // automatically adds createdAt and updatedAt fields
);

const Recipe = mongoose.model("Recipe", recipeSchema);

export default Recipe;