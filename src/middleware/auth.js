import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Expect "Bearer TOKEN"

  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // contains { id, role }
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
}

// Only allow admin
export function adminMiddleware(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden (Admin only)" });
  }
  next();
}
