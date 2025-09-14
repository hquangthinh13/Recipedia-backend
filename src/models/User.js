import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  createdAt: { type: Date, default: Date.now },
  avatar: { type: String }, // could store URL/path
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Recipe" }] // list of favorite recipes
}, { timestamps: true });

export default mongoose.model("User", userSchema);
