import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerui from "swagger-ui-express";
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
  "http://localhost:5173", // local dev
  "https://recipedia-frontend-omega.vercel.app", // your Vercel frontend
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
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

// Swagger setup
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Recipedia's API Documents",
      version: "0.1",
      description: "API",
      contact: {
        name: "Huynh Quang Thinh",
        email: "22521407@gm.uit.edu.vn",
      },
    },
    servers: [
      {
        // url: "https://recipedia-backend-6gp7.onrender.com/",
        url: "http://localhost:5001/",
      },
    ],
  },
  apis: ["./routes/*.js"],
};
const spacs = swaggerJSDoc(options);
app.use("/api-docs", swaggerui.serve, swaggerui.setup(spacs));

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log("Server is running on port 5001");
  });
});
