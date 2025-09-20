import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import recipeRoutes from "./routes/recipeRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

import { connectDB } from "./config/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware to parse JSON request bodies
if (process.env.NODE_ENV !== "production") {
  app.use(
    cors({
      origin: "http://localhost:5173",
    })
  );
}

app.use(express.json());

app.use("/api/recipes", recipeRoutes);
app.use("/api/users", userRoutes);
app.use("/api/comments", commentRoutes);

app.use("/api/upload", uploadRoutes);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log("Server is running on port 5001");
  });
});
