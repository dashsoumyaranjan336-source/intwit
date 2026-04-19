import express from 'express';
import reelCtrl from '../controllers/reelCtrl';
import { authMiddleware } from '../middleware/authMiddleWare'; // 🚨 Yahan curly brackets {} lagaye hain

const router = express.Router();

// 1. Route: Nayi Reel create karne ke liye 
router.post('/reels', authMiddleware, reelCtrl.createReel);

// 2. Route: Saari Reels fetch karne ke liye 
router.get('/reels', authMiddleware, reelCtrl.getReels);
router.patch('/reel/:id/like', authMiddleware, reelCtrl.likeReel);
router.patch('/reel/:id/unlike', authMiddleware, reelCtrl.unLikeReel);
router.patch('/reel/:id/view', authMiddleware, reelCtrl.updateView);

export default router;