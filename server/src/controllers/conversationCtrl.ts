import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import Conversation from "../models/conversationModel";
import Messages from "../models/messagesModel";
import User from "../models/userModel";

import { IReqAuth } from "../config/interface";

const createConversation = asyncHandler(
  async (req: IReqAuth, res: Response): Promise<void> => {
    try {
      // 🚫 Block check pehle hi kar lo taaki nayi chat ban hi na sake agar block hai
      const currentUser = await User.findById(req.user!._id);
      // Purana code hata kar ye likho
if (currentUser?.blockedUsers?.includes(req.params.id as any)) {
    res.status(400).json({ msg: "You have blocked this user. Unblock to chat." });
    return;
}

      const existingConversation = await Conversation.findOne({
        $or: [
          { recipients: [req.user!._id, req.params.id] },
          { recipients: [req.params.id, req.user!._id] },
        ],
      }).populate("recipients", "avatar username fullname");

      if (existingConversation) {
        res.json(existingConversation);
      } else {
        const newConversation = new Conversation({
          recipients: [req.user!._id, req.params.id],
        });
        await newConversation.save();

        const populatedConversation = await Conversation.findById(
          newConversation._id
        ).populate("recipients", "avatar username fullname");

        res.json(populatedConversation);
      }
    } catch (err: any) {
      throw new Error(err);
    }
  }
);

const deleteConversation = asyncHandler(
  async (req: IReqAuth, res: Response): Promise<void> => {
    try {
      const newConver = await Conversation.findOneAndDelete({
        _id: req.params.id,
      });
      if (newConver) {
        await Messages.deleteMany({ conversation: newConver._id });
      }
      res.json(newConver);
    } catch (err: any) {
      throw new Error(err);
    }
  }
);

// 🔍 1. GET ALL CONVERSATIONS (Ghost Mode Fix)
const getConversation = asyncHandler(
  async (req: IReqAuth, res: Response): Promise<void> => {
    try {
      // 🔴 STEP 1: Current User ki block list nikalo
      const currentUser = await User.findById(req.user!._id);
      // Jahan tune myBlockedList banayi hai
const myBlockedList = currentUser?.blockedUsers?.map(id => id.toString()) || [];

      // 🔴 STEP 2: Woh chats dhoondo jisme main recipient hu
      const conversations = await Conversation.find({
        recipients: req.user!._id,
      })
        .sort({ updatedAt: -1 })
        .populate("recipients", "avatar username fullname blockedUsers"); 

      // 🔴 STEP 3: MUTUAL BLOCK FILTER (Sabse Zaroori)
      const filteredConversations = conversations.filter(conv => {
        const otherUser = conv.recipients.find(r => (r as any)._id.toString() !== req.user!._id.toString()) as any;
        
        if (!otherUser) return true;

        const otherUserId = otherUser._id.toString();
        const hisBlockedList = otherUser.blockedUsers?.map((id: any) => id.toString()) || [];

        // 🚫 Condition: Na maine use block kiya ho, na usne mujhe
        const iBlockedHim = myBlockedList.includes(otherUserId);
        const heBlockedMe = hisBlockedList.includes(req.user!._id.toString());

        return !iBlockedHim && !heBlockedMe;
      });

      res.json(filteredConversations);
    } catch (err: any) {
      throw new Error(err);
    }
  }
);

// 🔍 2. GET SINGLE CONVERSATION
const getAConversation = asyncHandler(
  async (req: IReqAuth, res: Response): Promise<void> => {
    try {
      const conversation = await Conversation.findOne({
        _id: req.params.id,
        recipients: req.user!._id,
      }).populate("recipients", "avatar username fullname blockedUsers");

      if (!conversation) {
        res.status(404).json({ msg: "Conversation not found" });
        return;
      }

      // Single chat mein bhi block check
      const otherUser = conversation.recipients.find(r => (r as any)._id.toString() !== req.user!._id.toString()) as any;
      const currentUser = await User.findById(req.user!._id);
      
      // Jahan iBlockedHim check kar rahe ho
       const iBlockedHim = currentUser?.blockedUsers?.includes(otherUser._id as any);
      const heBlockedMe = otherUser.blockedUsers.includes(req.user!._id);

      if (iBlockedHim || heBlockedMe) {
        res.status(400).json({ msg: "Chat is hidden due to block." });
        return;
      }

      res.json([conversation]);
    } catch (err: any) {
      throw new Error(err);
    }
  }
);

const isReadConversation = asyncHandler(
  async (req: IReqAuth, res: Response): Promise<void> => {
    try {
      const msg = await Conversation.findOneAndUpdate(
        { _id: req.params.id },
        { isRead: true },
        { new: true }
      ).populate("recipients", "avatar username fullname");

      res.json(msg);
    } catch (err: any) {
      throw new Error(err);
    }
  }
);

export {
  createConversation,
  deleteConversation,
  getConversation,
  getAConversation,
  isReadConversation,
};