import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerui from "swagger-ui-express";
import recipeRoutes from "./routes/recipeRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { connectDB } from "./config/db.js";

import cookieParser from "cookie-parser";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(morgan("short"));

// Middleware to parse JSON request bodies
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        "https://recipedia-frontend-omega.vercel.app",
        "https://recipedia-backend-6gp7.onrender.com",
        "http://localhost:5173",
        "http://localhost:5001",
      ];

      if (
        !origin ||
        allowedOrigins.some((allowed) => origin.startsWith(allowed))
      ) {
        callback(null, true);
      } else {
        console.warn("❌ Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

app.use("/api/recipes", recipeRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Recipedia API Documentation",
      version: "1.0.0",
      description: `Welcome to the **Recipedia API**, the backend service powering the Recipedia web application — your go-to platform for discovering, creating, and sharing delicious recipes from around the world.

This API provides endpoints for managing users, recipes, and notifications. **bearerAuth:** eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZjhkM2UzMjc5ZmZiNjc5NGQ2ZGZkMyIsImVtYWlsIjoiaHF1YW5ndGhpbmgxM0BnbWFpbC5jb20iLCJpYXQiOjE3NjIxNzIzNTQsImV4cCI6MTc2MjE3NTk1NH0.aiHji-LxdNHN4IgkILJESHHNk_3zrJLT6wRKxsxRsc0
- [Frontend](https://recipedia-frontend-omega.vercel.app)  
- [Backend](https://recipedia-backend-6gp7.onrender.com)

Use this documentation to explore available endpoints, test requests, and integrate with the Recipedia backend services seamlessly.`,
      contact: {
        name: "Huynh Quang Thinh, Tran Tinh Dan Thanh",
        email: "22521407@gm.uit.edu.vn, 22521368@gm.uit.edu.vn",
      },
    },
    servers: [
      {
        url: "https://recipedia-backend-6gp7.onrender.com/",
        description: "Production server",
      },
      {
        url: "http://localhost:5001/",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    path.join(__dirname, "./routes/*.js"),
    path.join(__dirname, "./docs/*.js"),
  ],
};
const swaggerSpec = swaggerJSDoc(options);
app.use("/api-docs", swaggerui.serve, swaggerui.setup(swaggerSpec));

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log("Server is running.");
  });
});
