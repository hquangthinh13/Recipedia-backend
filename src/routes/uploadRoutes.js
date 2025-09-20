import express from "express";
import multer from "multer";
import dotenv from "dotenv";
dotenv.config();

// import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

// ===== Multer storage cho upload =====
// const storage = new CloudinaryStorage({
//   cloudinary,
//   params: {
//     folder: "recipedia",
//     allowed_formats: ["jpg", "png", "jpeg", "gif"],
//   },
// });
// const upload = multer({ storage });

// ===== Upload Recipe Cover =====
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
