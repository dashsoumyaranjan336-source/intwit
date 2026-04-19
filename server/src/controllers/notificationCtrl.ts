import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import Notify from "../models/notificationModel";
import { IReqAuth } from "../config/interface";

const createNotify = asyncHandler(
  async (req: IReqAuth, res: Response): Promise<void> => {
    try {
      const { id, recipients, images, url, content } = req.body;

      // Khud ko notification bhejne se rokna
      const filteredRecipients = recipients.filter(
        (recipientId: string) => recipientId !== req.user!._id.toString()
      );

      // Agar koi valid recipient nahi bacha, toh return kar do
      if (filteredRecipients.length === 0) {
        res.json({ msg: "No valid recipients." });
        return;
      }

      // 🔥 SPAM FILTER: Check karo ki same notification pehle se toh nahi hai
      const existingNotify = await Notify.findOne({
        id,                   // Target (e.g., kisko follow kiya ya kis post pe like kiya)
        user: req.user!._id,  // Action karne wala (Logged in user)
        content,              // Notification ka text (e.g., "has started to follow you.")
      });

      // Agar notification already database mein hai, toh naya mat banao
      if (existingNotify) {
        res.json({ msg: "Notification already exists. Spam prevented!" });
        return;
      }

      // Agar pehle se nahi hai, toh naya create karo
      const notify = new Notify({
        id,
        recipients: filteredRecipients,
        images,
        url,
        content,
        user: req.user!._id,
      });

      await notify.save();
      await notify.populate("user", "avatar username following followers");
      
      res.json(notify);
    } catch (err: any) {
      throw new Error(err);
    }
  }
);

const getNotify = asyncHandler(
  async (req: IReqAuth, res: Response): Promise<void> => {
    try {
      const notifies = await Notify.find({
        recipients: { $in: [req.user!._id] },
      })
        .sort("-createdAt")
        .populate("user", "avatar username following followers");

      res.json(notifies);
    } catch (err: any) {
      throw new Error(err);
    }
  }
);

const deleteNotify = asyncHandler(
  async (req: IReqAuth, res: Response): Promise<void> => {
    try {
      const notifies = await Notify.findOneAndDelete({
        id: req.params.id,
      })
        .sort("-createdAt")
        .populate("user", "avatar username following followers");

      res.json(notifies);
    } catch (err: any) {
      throw new Error(err);
    }
  }
);

const isReadNotify = asyncHandler(
  async (req: IReqAuth, res: Response): Promise<void> => {
    try {
      const notifies = await Notify.findOneAndUpdate(
        {
          _id: req.params.id,
        },
        { isRead: true },
        { new: true }
      ).populate("user", "avatar username following followers");

      res.json(notifies);
    } catch (err: any) {
      throw new Error(err);
    }
  }
);

export { createNotify, getNotify, deleteNotify, isReadNotify };