// routes/authRoutes.js
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  signup,
  verifyCode,
  resendCode,
  login,
  getMe,
  requestPasswordReset,
  verifyResetCode,
  resetPassword,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/verify-code", verifyCode);
router.post("/resend-code", resendCode);

router.post("/login", login);
router.get("/me", authMiddleware, getMe);

router.post("/request-password-reset", requestPasswordReset);
router.post("/verify-reset-code", verifyResetCode);
router.post("/reset-password", resetPassword);

export default router;
