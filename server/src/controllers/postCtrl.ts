import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import Post from "../models/postModel";
import Comment from "../models/commentModel";
import User from "../models/userModel";

import { IReqAuth } from "../config/interface";

class APIfeatures {
  private query: any;
  private queryString: any;

  constructor(query: any, queryString: any) {
    this.query = query;
    this.queryString = queryString;
  }

  public paginating() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 9;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

// 🔥 UPDATED: createPost function
const createPost = asyncHandler(
  async (req: IReqAuth, res: Response): Promise<void> => {
    try {
      // 🔥 NAYA: music aur mentions ko req.body se nikalna
      const { content, images, music, mentions } = req.body;

      // 🔥 NAYI VALIDATION: Ya toh content ho, ya images ho. Dono khali nahi hone chahiye.
      if ((!content || content.trim() === "") && (!images || images.length === 0)) {
        res.status(400).json({ msg: "Please add text or a photo to create a post." });
        return;
      }

      const newPost = new Post({
        content: content || "",
        images: images || [],
        music: music || "",       // 🔥 Music add kiya
        mentions: mentions || [], // 🔥 Mentions add kiye
        user: req.user?._id,
      });

      await User.findOneAndUpdate(
        { _id: req.user?._id },
        {
          $push: { post: newPost._id },
        },
        { new: true }
      );

      await (
        await newPost.populate("user", "avatar username fullname followers")
      ).save();

      res.json(newPost);
    } catch (err: any) {
      throw new Error(err);
    }
  }
);

// 🔍 1. GET HOME POSTS (Mutual Block Filter Added)
const getPosts = asyncHandler(
  async (req: IReqAuth, res: Response): Promise<void> => {
    try {
      const currentUser = await User.findById(req.user!._id);
      const blockedUsers = currentUser?.blockedUsers?.map(id => id.toString()) || [];

      // Following list se unko hata do jinhone block kiya hai ya tune block kiya hai
      const posts = await Post.find({
        user: [...req.user!.following, req.user!._id],
      })
        .populate("user", "avatar username fullname followers blockedUsers")
        .sort("-createdAt");

      // 🚫 JADU: Filter posts based on Mutual Block
      const filteredPosts = posts.filter(post => {
        const postUser = post.user as any;
        const iBlockedHim = blockedUsers.includes(postUser._id.toString());
        const heBlockedMe = postUser.blockedUsers?.some((id: any) => id.toString() === req.user!._id.toString());
        
        return !iBlockedHim && !heBlockedMe;
      });

      res.json(filteredPosts);
    } catch (err: any) {
      throw new Error(err);
    }
  }
);

const getUserPosts = asyncHandler(
  async (req: IReqAuth, res: Response): Promise<void> => {
    try {
      const user = await User.findOne({ username: req.params.username });
      if (!user) {
        res.status(400).json({ msg: "User does not exist." });
        return;
      }

      // Check block status before showing profile posts
      const currentUser = await User.findById(req.user!._id);
      // 🔴 Safe logic
      if (currentUser?.blockedUsers?.includes(user._id as any) || user.blockedUsers?.includes(req.user!._id as any)) {
          res.json([]); 
          return;
      }

      const posts = await Post.find({
        user: user._id,
      })
        .populate("user", "avatar username fullname followers")
        .sort("-createdAt");

      res.json(posts);
    } catch (err: any) {
      throw new Error(err);
    }
  }
);

// 🔍 2. GET EXPLORE POSTS (Mutual Block Filter Added)
const getExplorePosts = asyncHandler(
  async (req: IReqAuth, res: Response): Promise<void> => {
    try {
      const currentUser = await User.findById(req.user!._id);
      const following = currentUser!.following;
      const blockedUsers = currentUser?.blockedUsers || [];

      // Retrieve users who are not followed, not blocked, and not the current user
      const users = await User.find({
        _id: { $nin: [...following, ...blockedUsers, req.user!._id] },
        blockedUsers: { $ne: req.user!._id } // Woh log jinhone mujhe block kiya hai unhe bhi hatao
      });

      const posts = await Post.find({ user: { $in: users } }).populate(
        "user",
        "username avatar fullname followers"
      );
      res.json(posts);
    } catch (err: any) {
      throw new Error(err);
    }
  }
);

const getAPost = asyncHandler(
  async (req: IReqAuth, res: Response): Promise<void> => {
    try {
      const post = await Post.findById(req.params.id)
        .populate("user", "avatar username fullname followers blockedUsers");

      if (!post) {
        res.status(400).json({ msg: "This post does not exist." });
        return;
      }

      const currentUser = await User.findById(req.user!._id);
      const postUser = post.user as any;

      if (currentUser?.blockedUsers?.includes(postUser._id as any) || postUser.blockedUsers?.includes(req.user!._id as any)) {
          res.status(400).json({ msg: "Post hidden due to block." });
          return;
      }

      res.json(post);
    } catch (err: any) {
      throw new Error(err);
    }
  }
);

const likePost = asyncHandler(
  async (req: IReqAuth, res: Response): Promise<void> => {
    try {
      const like = await Post.findOneAndUpdate(
        { _id: req.params.id },
        {
          $addToSet: { likes: req.user!._id }, 
        },
        { new: true }
      );
      if (!like) {
        res.status(400).json({ msg: "This post does not exist." });
        return;
      }
      res.json(like);
    } catch (err: any) {
      throw new Error(err);
    }
  }
);

const unLikePost = asyncHandler(
  async (req: IReqAuth, res: Response): Promise<void> => {
    try {
      const unlike = await Post.findOneAndUpdate(
        { _id: req.params.id },
        {
          $pull: { likes: req.user!._id },
        },
        { new: true }
      );
      if (!unlike) {
        res.status(400).json({ msg: "This post does not exist." });
        return;
      }
      res.json(unlike);
    } catch (err: any) {
      throw new Error(err);
    }
  }
);

const updatePost = asyncHandler(
  async (req: IReqAuth, res: Response): Promise<void> => {
    try {
      const { id, content } = req.body;

      const post = await Post.findOneAndUpdate(
        { _id: id, user: req.user!._id }, 
        {
          content,
        },
        { new: true }
      ).populate("user", "avatar username fullname followers");

      res.json(post);
    } catch (err: any) {
      throw new Error(err);
    }
  }
);

const deletePost = asyncHandler(
  async (req: IReqAuth, res: Response): Promise<void> => {
    try {
      const post = await Post.findOneAndDelete({
        _id: req.params.id,
        user: req.user!._id,
      });
      if (post) {
        await User.findOneAndUpdate(
          { _id: req.user?._id },
          {
            $pull: { post: post._id },
          },
          { new: true }
        );
        await Comment.deleteMany({ _id: { $in: post.comments } });
        res.json(post);
      } else {
        res.status(400).json({ msg: "Post not found or unauthorized." });
      }
    } catch (err: any) {
      throw new Error(err);
    }
  }
);

const getSavedPost = asyncHandler(
  async (req: IReqAuth, res: Response): Promise<void> => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return;

      const posts = await Post.find({
        _id: { $in: user.saved },
      })
        .populate("user", "avatar username followers")
        .sort("-createdAt");

      res.json(posts);
    } catch (err: any) {
      throw new Error(err);
    }
  }
);

export {
  createPost,
  getPosts,
  getUserPosts,
  likePost,
  unLikePost,
  getAPost,
  updatePost,
  deletePost,
  getExplorePosts,
  getSavedPost,
};