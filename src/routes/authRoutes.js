import express from "express";
import { Signup, Login } from "../controllers/authController.js";
import userVerification from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/signup", Signup);
router.post("/login", Login);
router.post("/", userVerification);

// router.route("/").post();

// router.route("/refresh").get();

// router.route("/logout").post();

export default router;
