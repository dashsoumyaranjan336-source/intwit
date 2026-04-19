import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Cloudinary Configuration
// Ensure your .env has CLOUD_NAME, CLOUD_API_KEY, and CLOUD_API_SECRET
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
  secure: true,
});

/**
 * Common Helper function to handle Cloudinary Uploads
 */
const uploadToCloudinary = async (fileUpload: string, folderName: string) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      fileUpload,
      {
        folder: `MERN-intwit-typescript/${folderName}`,
        resource_type: "auto",
      },
      (error, result: any) => {
        if (error) {
          // ⚠️ Ye line terminal mein asli error dikhayegi (e.g., Invalid API Key)
          console.error(`❌ CLOUDINARY ${folderName.toUpperCase()} UPLOAD ERROR:`, error);
          reject(error);
        } else {
          resolve({
            url: result.secure_url,
            asset_id: result.asset_id,
            // Extracting the ID after the folder path
            public_id: result.public_id.split("/").pop(), 
          });
        }
      }
    );
  });
};

// --- Upload Functions ---

export const cloudinaryUploadImgAvatar = async (fileUpload: string) => {
  return uploadToCloudinary(fileUpload, "avatar");
};

export const cloudinaryUploadImgPost = async (fileUpload: string) => {
  return uploadToCloudinary(fileUpload, "post");
};

export const cloudinaryUploadImgMessages = async (fileUpload: string) => {
  return uploadToCloudinary(fileUpload, "messages");
};

// --- Delete Functions ---

export const cloudinaryDeleteImgAvatar = async (publicId: string) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(
      `MERN-intwit-typescript/avatar/${publicId}`,
      (error, result: any) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
  });
};

export const cloudinaryDeleteImgPost = async (publicId: string) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(
      `MERN-intwit-typescript/post/${publicId}`,
      (error, result: any) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
  });
};

export const cloudinaryDeleteImgMessages = async (publicId: string) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(
      `MERN-intwit-typescript/messages/${publicId}`,
      (error, result: any) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
  });
};