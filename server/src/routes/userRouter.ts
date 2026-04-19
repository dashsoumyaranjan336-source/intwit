import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleWare";
import {
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
  getBlockedUsers // ✅ Imported correctly
} from "../controllers/userCtrl";

const router: Router = Router();

// --- GET ROUTES ---

// 🔍 Search: Ab isme blocked users nahi dikhenge ($nin logic added in ctrl)
router.get("/search", authMiddleware, searchUser); 

// 💡 Suggestions: Blocked log yahan se bhi gayab
router.get("/suggestions", authMiddleware, getSuggestionUser);

// 🚫 Blocked List: Instagram style blocked users dekhne ke liye
router.get("/blocked_list", authMiddleware, getBlockedUsers); 

// 👤 Profile: Kisi user ki info lene ke liye
router.get("/:username", authMiddleware, getUser);


// --- PUT ROUTES ---

router.put("/follow/:id", authMiddleware, followUser);
router.put("/unfollow/:id", authMiddleware, unfollowUser);
router.put("/remove-follower/:id", authMiddleware, removeFollower);
router.put("/save-post/:id", authMiddleware, savePost);
router.put("/unsave-post/:id", authMiddleware, unSavePost);


// --- PRIVACY & BLOCK ROUTES ---

router.put("/toggle-privacy", authMiddleware, togglePrivacy);
router.put("/block/:id", authMiddleware, blockUser);

export default router;