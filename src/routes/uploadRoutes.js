import express from "express";
import dotenv from "dotenv";
dotenv.config();

import cloudinary from "../config/cloudinary.js";

const router = express.Router();

// ===== Upload Recipe Cover To Cloudinary =====
router.post("/", async (req, res) => {
  try {
    const { image } = req.body;

    const uploadedImage = await cloudinary.uploader.upload(image, {
      upload_preset: "unsigned_upload",
      use_filename: true,
      unique_filename: true,
      allowed_formats: ["jpg", "png", "jpeg"],
    });

    console.log("Uploaded to Cloudinary:", uploadedImage);
    res.status(200).json(uploadedImage); // ✅ safe
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
