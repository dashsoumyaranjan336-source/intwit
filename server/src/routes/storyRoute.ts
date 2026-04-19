import express from 'express';
import storyCtrl from '../controllers/storyCtrl';
// 🚨 ASLI FIX YAHAN HAI 👇
import { authMiddleware } from '../middleware/authMiddleWare'; 

const router = express.Router();

// 1. Nayi story create karne ke liye
router.post('/story', authMiddleware, storyCtrl.createStory);

// 2. Saari stories fetch karne ke liye (Following + Own)
router.get('/story', authMiddleware, storyCtrl.getStories);

// 3. Apni story delete karne ke liye
router.delete('/story/:id', authMiddleware, storyCtrl.deleteStory);

export default router;