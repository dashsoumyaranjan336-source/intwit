import { Request, Response } from "express";
import Stories from "../models/storyModel";
import asyncHandler from "express-async-handler";
import { IReqAuth } from "../config/interface";

const storyCtrl = {
  // 1. Nayi story upload karna (Updated with Audio)
  createStory: asyncHandler(async (req: IReqAuth, res: Response): Promise<void> => {
    try {
      // 🔴 NAYA: Body se audioUrl bhi nikalna hai
      const { image, audioUrl } = req.body;

      if (!image) {
        res.status(400).json({ msg: "Please add your photo." });
        return;
      }

      const newStory = new Stories({
        user: req.user?._id,
        image,
        audioUrl: audioUrl || "", // 🔴 NAYA: Database mein save kiya
      });

      await newStory.save();

      res.json({
        msg: "Story Created!",
        newStory: {
          ...newStory.toObject(),
          user: req.user,
        },
      });
    } catch (err: any) {
      res.status(500).json({ msg: err.message });
    }
  }),

  // 2. Home page ke liye stories fetch karna
  getStories: asyncHandler(async (req: IReqAuth, res: Response): Promise<void> => {
    try {
      // Logic: Unki stories uthao jinhe user follow karta hai + apni khud ki
      const stories = await Stories.find({
        user: { $in: [...(req.user?.following || []), req.user?._id] },
      })
        .sort("-createdAt")
        .populate("user", "avatar username fullname");

      res.json(stories);
    } catch (err: any) {
      res.status(500).json({ msg: err.message });
    }
  }),

  // 3. Story delete karna (Optional)
  deleteStory: asyncHandler(async (req: IReqAuth, res: Response): Promise<void> => {
    try {
      const story = await Stories.findOneAndDelete({
        _id: req.params.id,
        user: req.user?._id,
      });

      if (!story) {
        res.status(400).json({ msg: "Story not found or unauthorized." });
        return;
      }

      res.json({ msg: "Story Deleted!" });
    } catch (err: any) {
      res.status(500).json({ msg: err.message });
    }
  }),
};

export default storyCtrl;