import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import fs from "fs";

import {
  cloudinaryDeleteImgAvatar,
  cloudinaryDeleteImgMessages,
  cloudinaryDeleteImgPost,
  cloudinaryUploadImgAvatar,
  cloudinaryUploadImgMessages,
  cloudinaryUploadImgPost,
} from "../utils/cloudinary";

const uploadImagesAvatar = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    try {
      const uploader = (path: string) => cloudinaryUploadImgAvatar(path);
      const urls = [];
      const files = req.files as Express.Multer.File[];

      for (const file of files) {
        const { path } = file;
        const newpath = await uploader(path);
        urls.push(newpath);
        fs.unlinkSync(path);
      }
      const images = urls.map((file) => {
        return file;
      });
      res.json(images);
    } catch (error: any) {
      throw new Error(error);
    }
  }
);

const uploadImagesPost = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Yahan resource_type: "auto" pass karna zaroori hai
      const uploader = (path: string) => cloudinaryUploadImgPost(path); 
      const urls = [];
      const files = req.files as Express.Multer.File[];

      console.log("Backend: Received files count:", files?.length);

      for (const file of files) {
        const { path } = file;
        // Hum yahan path ke saath-saath backend terminal mein log bhi dekhenge
        const newpath = await uploader(path);
        console.log("Backend: Cloudinary Result:", newpath);
        urls.push(newpath);
        if (fs.existsSync(path)) fs.unlinkSync(path);
      }
      res.json(urls);
    } catch (error: any) {
      console.error("Backend Upload Error:", error);
      res.status(500).json({ message: error.message });
    }
  }
);
const uploadImagesMessages = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    try {
      const uploader = (path: string) => cloudinaryUploadImgMessages(path);
      const urls = [];
      const files = req.files as Express.Multer.File[];

      for (const file of files) {
        const { path } = file;
        const newpath = await uploader(path);
        urls.push(newpath);
        fs.unlinkSync(path);
      }
      const images = urls.map((file) => {
        return file;
      });
      res.json(images);
    } catch (error: any) {
      throw new Error(error);
    }
  }
);

const deleteImagesAvatar = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
      const deleted = cloudinaryDeleteImgAvatar(id);
      res.json({ public_id: id });
    } catch (error: any) {
      throw new Error(error);
    }
  }
);

const deleteImagesPost = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
      const deleted = cloudinaryDeleteImgPost(id);

      res.json({ public_id: id });
    } catch (error: any) {
      throw new Error(error);
    }
  }
);
const deleteImagesMessages = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
      const deleted = cloudinaryDeleteImgMessages(id);

      res.json({ public_id: id });
    } catch (error: any) {
      throw new Error(error);
    }
  }
);

export {
  uploadImagesAvatar,
  uploadImagesPost,
  uploadImagesMessages,
  deleteImagesAvatar,
  deleteImagesPost,
  deleteImagesMessages,
};
