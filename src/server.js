import express from "express";
import recipeRoutes from "./routes/recipeRoutes.js";


const app = express();

app.use("/api/recipes", recipeRoutes);
// app.use("/api/users", usersRoutes);



app.listen(5001, () => {
  console.log("Server is running on port 5001")
});