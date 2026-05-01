import multer, { FileFilterCallback } from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { Request, Response, NextFunction } from "express";

// 1. Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../")); // File ko root/temp folder mein save karega
  },
  filename: function (req, file, cb) {
    const uniquesuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // Original extension nikalna (video ho ya image)
    const ext = path.extname(file.originalname) || (file.mimetype.startsWith("video") ? ".mp4" : ".jpeg");
    cb(null, file.fieldname + "-" + uniquesuffix + ext);
  },
});

// 2. Filter Configuration (Image aur Video dono allow karega)
const multerFilter = (req: Request, file: any, cb: FileFilterCallback) => {
  if (file.mimetype.startsWith("image") || file.mimetype.startsWith("video")) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// 3. Upload Middleware Export
export const uploadPhoto = multer({
  storage: storage,
  fileFilter: multerFilter,
  limits: { fileSize: 52428800 }, // 50MB limit reels ke liye
});

// 4. Image Resize Middleware Export (Saaf aur Safe banaya hua)
export const imgResize = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const files = req.files as Express.Multer.File[];

  if (!files) return next();

  await Promise.all(
    files.map(async (file) => {
      // FIX: Agar file Video hai, toh sharp wale process ko chup-chap skip kardo
      if (file.mimetype.startsWith("video")) {
         return; 
      }

      // Agar image hai toh use resize karke save karo
      const outputPath = path.join(__dirname, `../${file.filename}`);

      await sharp(file.path)
        .resize(300, 300)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(outputPath);
        
      // Purani file ko delete kar do taaki space bache
      if (fs.existsSync(file.path)) {
         fs.unlinkSync(file.path);
      }
    })
  );
  next();
};