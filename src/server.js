import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import recipeRoutes from "./routes/recipeRoutes.js";
// import userRoutes from "./routes/userRoutes.js";
// import commentRoutes from "./routes/commentRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import authRoutes from "./routes/authRoutes.js";

import { connectDB } from "./config/db.js";

import cookieParser from "cookie-parser";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware to parse JSON request bodies
const allowedOrigins = [
  "http://localhost:5173",
  "https://recipedia-frontend.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps, curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

app.use("/api/recipes", recipeRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/comments", commentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log("Server is running on port 5001");
  });
});
