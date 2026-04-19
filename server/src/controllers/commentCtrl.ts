import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import Comment from "../models/commentModel";
import Post from "../models/postModel";
import User from "../models/userModel"; // 🔴 User model import kiya check ke liye

import { IReqAuth } from "../config/interface";

const createComment = asyncHandler(
  async (req: IReqAuth, res: Response): Promise<void> => {
    try {
      const { postId, content, tag, reply } = req.body;
      const post = await Post.findById(postId);

      if (!post) {
        res.status(400).json({ msg: "This post does not exist." });
        return;
      }

      if (reply) {
        const cm = await Comment.findById(reply);
        if (!cm) {
          res.status(400).json({ msg: "This comment does not exist." });
          return;
        }
      }
      const newComment = new Comment({
        user: req.user!._id,
        content,
        tag,
        reply,
        postId,
      });

      await Post.findOneAndUpdate(
        { _id: postId },
        {
          $push: { comments: newComment._id },
        },
        { new: true }
      );

      await (
        await newComment.populate(
          "user",
          "avatar username fullname followers following"
        )
      ).save();
      res.json(newComment);
    } catch (err: any) {
      throw new Error(err);
    }
  }
);

// 🔍 1. GET COMMENTS (Mutual Block Filter Added)
const getComments = asyncHandler(
  async (req: IReqAuth, res: Response): Promise<void> => {
    try {
      const currentUser = await User.findById(req.user!._id);
      const blockedUsers = currentUser?.blockedUsers?.map(id => id.toString()) || [];

      const posts = await Post.find({
        user: [...req.user!.following, req.user!._id],
      });
      const postIds = posts.map((post) => post._id); 
      
      const comments = await Comment.find({
        postId: { $in: postIds },
      }).populate("user", "avatar username fullname followers following blockedUsers");

      // 🚫 JADU: Filter comments based on Mutual Block
      const filteredComments = comments.filter(comment => {
        const commentUser = comment.user as any;
        const iBlockedHim = blockedUsers.includes(commentUser._id.toString());
        const heBlockedMe = commentUser.blockedUsers?.some((id: any) => id.toString() === req.user!._id.toString());
        
        return !iBlockedHim && !heBlockedMe;
      });

      res.json(filteredComments);
    } catch (err: any) {
      throw new Error(err);
    }
  }
);

// 🔍 2. GET COMMENTS BY POST (Specific Post Filter)
const getCommentsByPost = asyncHandler(
  async (req: IReqAuth, res: Response): Promise<void> => {
    try {
      const currentUser = await User.findById(req.user!._id);
      const blockedUsers = currentUser?.blockedUsers?.map(id => id.toString()) || [];

      const comments = await Comment.find({
        postId: req.params.id,
      }).populate("user", "avatar username fullname followers following blockedUsers");

      // 🚫 Mutual Block Filter
      const filtered = comments.filter(comment => {
        const commentUser = comment.user as any;
        const iBlockedHim = blockedUsers.includes(commentUser._id.toString());
        const heBlockedMe = commentUser.blockedUsers?.some((id: any) => id.toString() === req.user!._id.toString());
        
        return !iBlockedHim && !heBlockedMe;
      });

      res.json(filtered);
    } catch (err: any) {
      throw new Error(err);
    }
  }
);

const updateComment = asyncHandler(
  async (req: IReqAuth, res: Response): Promise<void> => {
    try {
      const { id, content } = req.body;
      const comment = await Comment.findOneAndUpdate(
        { _id: id, user: req.user!._id }, // Ensure user owns the comment
        {
          content,
        },
        { new: true }
      ).populate("user", "avatar username fullname followers following");

      res.json(comment);
    } catch (err: any) {
      throw new Error(err);
    }
  }
);

const deleteComment = asyncHandler(
  async (req: IReqAuth, res: Response): Promise<void> => {
    try {
      const comment = await Comment.findOneAndDelete({
        _id: req.params.id,
        user: req.user!._id,
      });
      
      if(comment) {
          await Post.findOneAndUpdate(
            { _id: comment.postId },
            {
              $pull: { comments: req.params.id },
            }
          );
          res.json(comment);
      } else {
          res.status(400).json({msg: "Comment not found or unauthorized."});
      }
    } catch (err: any) {
      throw new Error(err);
    }
  }
);

const likeComment = asyncHandler(
  async (req: IReqAuth, res: Response): Promise<void> => {
    try {
      const comment = await Comment.findOneAndUpdate(
        { _id: req.params.id, likes: { $ne: req.user!._id } },
        {
          $push: { likes: req.user!._id },
        },
        { new: true }
      );

      if (!comment) {
        res.status(400).json({ msg: "You already liked this comment." });
        return;
      }

      res.json(comment);
    } catch (err: any) {
      throw new Error(err);
    }
  }
);

const unLikeComment = asyncHandler(
  async (req: IReqAuth, res: Response): Promise<void> => {
    try {
      const comment = await Comment.findOneAndUpdate(
        {
          _id: req.params.id,
        },
        {
          $pull: { likes: req.user!._id },
        },
        { new: true }
      );

      res.json(comment);
    } catch (err: any) {
      throw new Error(err);
    }
  }
);

export {
  createComment,
  getComments,
  likeComment,
  unLikeComment,
  updateComment,
  deleteComment,
  getCommentsByPost,
};