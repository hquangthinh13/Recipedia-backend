import sharp from "sharp";
import cloudinary from "../config/cloudinary.js";

export async function processAndUploadRecipeImage(file) {
  if (!file) return null;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "recipes",
        resource_type: "image",
        format: "webp",
      },
      (error, result) => {
        if (error) return reject(error);

        resolve({
          coverImage: result.secure_url,
          coverImagePublicId: result.public_id,
        });
      }
    );

    sharp(file.buffer)
      .resize({ width: 1280, height: 720, fit: "cover" }) // 16:9 crop
      .webp({ quality: 85 })
      .pipe(uploadStream);
  });
}
