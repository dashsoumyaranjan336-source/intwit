import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import User from "../models/userModel";
import { IReqAuth } from "../config/interface";

// 🔍 1. USER SEARCH KARNE KE LIYE 
const searchUser = asyncHandler(
  async (req: IReqAuth, res: Response): Promise<void> => { 
    try {
      //  STEP 1: Logged-in user ki block list nikalo
      let excludeIds: any[] = [];
      if (req.user) {
        const currentUser = await User.findById(req.user._id);
        const blockedUsers = currentUser?.blockedUsers || [];
        // Khud ko aur blocked users ko list me daal do jinko search me NAHI dikhana
        excludeIds = [...blockedUsers, req.user._id]; 
      }

      // STEP 2: Database ko bolo un IDs ko ignore kare ($nin)
      const users = await User.find({
        username: { $regex: req.query.username },
        _id: { $nin: excludeIds } 
      })
        .limit(10)
        .select("fullname username avatar");

      res.json({ users });
    } catch (err: any) {
      throw new Error(err);
    }
  }
);

//  2. KISI SPECIFIC USER KI PROFILE LENI HO
const getUser = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await User.findOne({ username: req.params.username })
        .select("-password")
        .populate(
          "followers following",
          "avatar username fullname followers following"
        );

      if (!data) {
        res.status(400).json({ msg: "User does not exist." });
        return;
      }

      res.json(data);
    } catch (err: any) {
      throw new Error(err);
    }
  }
);

//  3. SUGGESTIONS WALE USERS ( Fixed & Verified)
const getSuggestionUser = asyncHandler(
  async (req: IReqAuth, res: Response): Promise<void> => {
    try {
      const currentUser = await User.findById(req.user!._id);
      if (!currentUser) return;

      const following = currentUser.following || [];
      const blockedUsers = currentUser.blockedUsers || [];

      const users = await User.find({
        $and: [
          // 1. Woh meri following, meri block list mein na ho, aur main khud na ho
          { _id: { $nin: [...following, ...blockedUsers, req.user!._id] } },
          
          // 2.  STEP: Woh banda suggestions mein na aaye JISNE MUJHE block kiya hai
          { blockedUsers: { $ne: req.user!._id } } 
        ]
      })
      .select("-password")
      .limit(5)
      .populate("followers following", "username avatar fullname");

      res.json(users);
    } catch (err: any) {
      res.status(500).json({ msg: err.message });
    }
  }
);

//  4. FOLLOW USER ( BUG FIX: Spam Notification Issue)
const followUser = asyncHandler(
  async (req: IReqAuth, res: Response): Promise<void> => {
    try {
      //  CHECK: findOne use kiya (jyada fast hai) aur check strong kiya
      const existingUser = await User.findOne({
        _id: req.params.id,
        followers: req.user!._id,
      });

      // Agar pehle se list mein hai, toh yahi rok do (Status 400 bheja instead of 500)
      if (existingUser) {
        res.status(400).json({ msg: "You already followed this user." });
        return;
      }

      // Agar list mein nahi hai, tabhi aage badho
      await User.findOneAndUpdate(
        { _id: req.params.id },
        { $addToSet: { followers: req.user!._id } }, 
        { new: true }
      );

      const newUser = await User.findOneAndUpdate(
        { _id: req.user!._id },
        { $addToSet: { following: req.params.id } }, 
        { new: true }
      )
        .select("-password")
        .populate(
          "followers following",
          "avatar username fullname followers following"
        );

      res.json(newUser);
    } catch (err: any) {
      throw new Error(err);
    }
  }
);

//  5. UNFOLLOW USER
const unfollowUser = asyncHandler(
  async (req: IReqAuth, res: Response): Promise<void> => {
    try {
      await User.findOneAndUpdate(
        { _id: req.params.id },
        { $pull: { followers: req.user!._id } },
        { new: true }
      );

      const newUser = await User.findOneAndUpdate(
        { _id: req.user!._id },
        { $pull: { following: req.params.id } },
        { new: true }
      )
        .select("-password")
        .populate(
          "followers following",
          "avatar username fullname followers following"
        );

      res.json(newUser);
    } catch (err: any) {
      throw new Error(err);
    }
  }
);

//  10. REMOVE FOLLOWER
const removeFollower = asyncHandler(
  async (req: IReqAuth, res: Response): Promise<void> => {
    try {
      const newUser = await User.findOneAndUpdate(
        { _id: req.user!._id },
        { $pull: { followers: req.params.id } },
        { new: true }
      )
        .select("-password")
        .populate("followers following", "avatar username fullname followers following"); 

      await User.findOneAndUpdate(
        { _id: req.params.id },
        { $pull: { following: req.user!._id } },
        { new: true }
      );

      res.json(newUser);
    } catch (err: any) {
      throw new Error(err);
    }
  }
);

//  6. SAVE POST
const savePost = asyncHandler(
  async (req: IReqAuth, res: Response): Promise<void> => {
    try {
      const user = await User.find({
        _id: req.user!._id,
        saved: req.params.id,
      });
      if (user.length > 0) {
        res.status(400).json({ msg: "You already saved this post." });
        return;
      }

      const save = await User.findOneAndUpdate(
        { _id: req.user!._id },
        { $push: { saved: req.params.id } },
        { new: true }
      );

      if (!save) {
        res.status(400).json({ msg: "This post does not exist." });
        return;
      }

      res.json(save);
    } catch (err: any) {
      throw new Error(err);
    }
  }
);

//  7. UNSAVE POST
const unSavePost = asyncHandler(
  async (req: IReqAuth, res: Response): Promise<void> => {
    try {
      const unSave = await User.findOneAndUpdate(
        { _id: req.user!._id },
        { $pull: { saved: req.params.id } },
        { new: true }
      );

      if (!unSave) {
        res.status(400).json({ msg: "This post does not exist." });
        return;
      }

      res.json(unSave);
    } catch (err: any) {
      throw new Error(err);
    }
  }
);

//  8. TOGGLE PRIVACY 
const togglePrivacy = asyncHandler(
  async (req: IReqAuth, res: Response): Promise<void> => {
    try {
      const user = await User.findById(req.user!._id);
      if (!user) {
        res.status(404).json({ msg: "User nahi mila bhai!" });
        return;
      }

      user.isPrivate = !user.isPrivate;
      await user.save();

      res.json({
        msg: user.isPrivate ? "Account is now Private 🔒" : "Account is now Public 🌍",
        isPrivate: user.isPrivate,
      });
    } catch (err: any) {
      throw new Error(err);
    }
  }
);

//  9. BLOCK/UNBLOCK USER 
const blockUser = asyncHandler(
  async (req: IReqAuth, res: Response): Promise<void> => {
    try {
      const userToBlock = await User.findById(req.params.id);
      if (!userToBlock) {
        res.status(404).json({ msg: "User nahi mila!" });
        return;
      }

      const currentUser = await User.findById(req.user!._id);
      const blockedArray = currentUser?.blockedUsers || [];
      const isBlocked = blockedArray.includes(userToBlock._id);

      if (isBlocked) {
        // UNBLOCK KARNA HAI
        await User.findByIdAndUpdate(req.user!._id, {
          $pull: { blockedUsers: userToBlock._id },
        });
        res.json({ msg: "User Unblocked! 🔓" });
      } else {
        // BLOCK KARNA HAI 
        await User.findByIdAndUpdate(req.user!._id, {
          $push: { blockedUsers: userToBlock._id },
          $pull: { following: userToBlock._id, followers: userToBlock._id }
        });

        await User.findByIdAndUpdate(userToBlock._id, {
          $pull: { followers: req.user!._id, following: req.user!._id }
        });

        res.json({ msg: "User Blocked successfully! 🚫" });
      }
    } catch (err: any) {
      throw new Error(err);
    }
  }
);

//  11. GET BLOCKED USERS LIST
const getBlockedUsers = asyncHandler(
  async (req: IReqAuth, res: Response): Promise<void> => {
    try {
      const user = await User.findById(req.user!._id)
        .populate("blockedUsers", "avatar username fullname");

      if (!user) {
        res.status(404).json({ msg: "User nahi mila!" });
        return;
      }

      res.json(user.blockedUsers);
    } catch (err: any) {
      throw new Error(err);
    }
  }
);

export {
  searchUser,
  getUser,
  followUser,
  unfollowUser,
  removeFollower,
  getSuggestionUser,
  savePost,
  unSavePost,
  togglePrivacy,
  blockUser,
  getBlockedUsers,
};