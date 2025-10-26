// middleware/optionalAuth.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import User from "../models/User.js";
dotenv.config();

const optionalAuth = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return next(); // No token, proceed as guest

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("_id");
  } catch {
    // Ignore invalid token — proceed as guest
  }
  next();
};

export default optionalAuth;
