import sharp from "sharp";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

export async function processAndUploadRecipeImage(file) {
  if (!file) return null;

  const imageBuffer = await sharp(file.buffer)
    .resize({ width: 1280, height: 720, fit: "cover" }) // 16:9 crop
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toBuffer();

  const uploadStream = () =>
    new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "recipes",
          format: "jpeg",
          transformation: [{ width: 1280, height: 720, crop: "fill" }],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      streamifier.createReadStream(imageBuffer).pipe(stream);
    });

  const cloudinaryResult = await uploadStream();

  return {
    coverImage: cloudinaryResult.secure_url,
    coverImagePublicId: cloudinaryResult.public_id,
  };
}
