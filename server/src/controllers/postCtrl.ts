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

// 1. UPDATED: createPost function (Mentions Regex Added)
const createPost = asyncHandler(
  async (req: IReqAuth, res: Response): Promise<void> => {
    try {
      let { content, images, music } = req.body;

      //  Agar frontend ne gaane ko text (String) banakar bheja hai, toh use wapas Object banao
      if (music && typeof music === "string") {
        try {
          music = JSON.parse(music);
        } catch (e) {
          console.log("Music parsing mein choti si dikkat aayi.");
        }
      }

      if ((!content || content.trim() === "") && (!images || images.length === 0)) {
        res.status(400).json({ msg: "Please add text or a photo to create a post." });
        return;
      }

      //  Caption me se @usernames dhoondho aur unki real IDs nikalo
      let mentionIds: any[] = [];
      if (content) {
        // Regex jo @ ke baad wale naam nikalega
        const usernames = content.match(/@([a-zA-Z0-9_.]+)/g)?.map((m: string) => m.substring(1)) || [];
        
        if (usernames.length > 0) {
          // Database mein un users ko dhoondho
          const users = await User.find({ username: { $in: usernames } });
          mentionIds = users.map(u => u._id); // Unki asli ID mentions array mein jayegi
        }
      }

      const newPost = new Post({
        content: content || "",
        images: images || [],
        music: music || { name: "", url: "" }, // 🔥 Ekdum safe Object
        mentions: mentionIds, //  Yahan proper User IDs save hongi
        user: req.user?._id,
      });

      //  STEP 1: PEHLE POST SAVE HOGI (Taaki error aaye toh counter bilkul na badhe)
      await newPost.save();

      //  STEP 2: POST SAVE HONE KE BAAD HI COUNTER BADHEGA
      await User.findOneAndUpdate(
        { _id: req.user?._id },
        { $push: { post: newPost._id } },
        { new: true }
      );

      await newPost.populate("user", "avatar username fullname followers");
      
      res.json(newPost);
    } catch (err: any) {
      // 🚨 JASOOS: Agar koi bhi error aayi, toh ab wo is terminal mein pakka print hogi!
      console.log("🚨 CREATE POST ERROR:", err.message);
      res.status(500).json({ msg: err.message });
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

      // Filter posts based on Mutual Block
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

//  2. getUserPosts function
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
      
      //  SAFE LOGIC: MongoDB ObjectIds ko string (.toString) mein convert karna zaroori hai!
      const iBlockedHim = currentUser?.blockedUsers?.some(id => id.toString() === user._id.toString());
      const heBlockedMe = user.blockedUsers?.some(id => id.toString() === req.user!._id.toString());

      if (iBlockedHim || heBlockedMe) {
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
      res.status(500).json({ msg: err.message });
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

//  updatePost function (Mentions Regex Added)
const updatePost = asyncHandler(
  async (req: IReqAuth, res: Response): Promise<void> => {
    try {
      const { id, content } = req.body;

      // 🔥 JASOOS LOGIC FOR EDIT: (Edit ke time pe bhi mentions check honge)
      let mentionIds: any[] = [];
      if (content) {
        const usernames = content.match(/@([a-zA-Z0-9_.]+)/g)?.map((m: string) => m.substring(1)) || [];
        if (usernames.length > 0) {
          const users = await User.find({ username: { $in: usernames } });
          mentionIds = users.map(u => u._id);
        }
      }

      const post = await Post.findOneAndUpdate(
        { _id: id, user: req.user!._id }, 
        {
          content,
          mentions: mentionIds // ✅ Updated mentions yahan database me save jayenge
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
        
        // 🔥 YAHAN THI GALTI: Wapas original res.json(post) kar diya!
        res.json(post); 
      } else {
        res.status(400).json({ msg: "Post not found or already deleted." });
      }
    } catch (err: any) {
      res.status(500).json({ msg: err.message });
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