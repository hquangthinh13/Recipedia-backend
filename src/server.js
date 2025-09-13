import express from "express";
import dotenv from "dotenv";
import recipeRoutes from "./routes/recipeRoutes.js";

import { connectDB } from "./config/db.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5001;

// Middleware to parse JSON request bodies
app.use(express.json());

app.use("/api/recipes", recipeRoutes);
// app.use("/api/users", usersRoutes);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log("Server is running on port 5001");
  });
});
