import { Request, Response } from 'express';
import Reels from '../models/reelModel';

const reelCtrl = {
    // 1. Nayi Reel banane ka logic
    createReel: async (req: any, res: Response) => {
        try {
            const { videoUrl, audioUrl, filterName, caption } = req.body;

            if(!videoUrl) return res.status(400).json({msg: "Video URL is required."});

            const newReel = new Reels({
                videoUrl,
                audioUrl,
                filterName,
                caption,
                user: req.user._id 
            });

            await newReel.save();

            res.status(200).json({
                msg: 'Boom! Reel created successfully! 🎉',
                newReel: {
                    ...newReel.toObject(),
                    user: req.user
                }
            });
        } catch (err: any) {
            return res.status(500).json({ msg: err.message });
        }
    },

    // 2. Reels fetch karna (FIXED 500 CRASH ERROR 🔥)
    getReels: async (req: any, res: Response) => {
        try {
            const currentUser = req.user;

            const reels = await Reels.find()
                .sort('-createdAt')
                .populate('user', 'avatar username fullname followers isPrivate blocking');

            const filteredReels = reels.filter(reel => {
                const reelUser: any = reel.user;
                if (!reelUser) return false;

                // 🚨 FIX: '?.' lagaya hai taaki undefined ho toh crash na kare
                const isBlocked = currentUser.blocking?.includes(reelUser._id) || 
                                  reelUser.blocking?.includes(currentUser._id);
                
                if (isBlocked) return false;

                if (reelUser.isPrivate && reelUser._id.toString() !== currentUser._id.toString()) {
                    return reelUser.followers?.includes(currentUser._id);
                }

                return true;
            });

            res.status(200).json({
                msg: 'Success',
                result: filteredReels.length,
                reels: filteredReels
            });
        } catch (err: any) {
            console.error("🔥 GET REELS CRASH:", err.message); // Agar firse crash hua toh terminal me dikhega
            return res.status(500).json({ msg: err.message });
        }
    },

    // 3. Reel Like karne ka logic
    likeReel: async (req: any, res: Response) => {
        try {
            const reel = await Reels.findOne({_id: req.params.id, likes: req.user._id});
            if(reel) return res.status(400).json({msg: "You already liked this reel."});

            const like = await Reels.findOneAndUpdate({_id: req.params.id}, {
                $push: { likes: req.user._id }
            }, { new: true });

            if(!like) return res.status(400).json({msg: "Reel not found."});

            res.json({ msg: 'Liked Reel! ❤️' });
        } catch (err: any) {
            return res.status(500).json({ msg: err.message });
        }
    },

    // 4. Reel Unlike karne ka logic
    unLikeReel: async (req: any, res: Response) => {
        try {
            const unlike = await Reels.findOneAndUpdate({_id: req.params.id}, {
                $pull: { likes: req.user._id }
            }, { new: true });

            if(!unlike) return res.status(400).json({msg: "Reel not found."});

            res.json({ msg: 'Unliked Reel! 💔' });
        } catch (err: any) {
            return res.status(500).json({ msg: err.message });
        }
    },

    // 5. Reel View badhane ka logic
    updateView: async (req: any, res: Response) => {
        try {
            await Reels.findOneAndUpdate({_id: req.params.id}, {
                $inc: { views: 1 }
            });
            res.json({ msg: 'View updated! 👁️' });
        } catch (err: any) {
            return res.status(500).json({ msg: err.message });
        }
    },

    // 🔥 6. NAYA: Reel Delete karne ka logic
    deleteReel: async (req: any, res: Response) => {
        try {
            const reel = await Reels.findOneAndDelete({
                _id: req.params.id,
                user: req.user._id // Sirf owner hi delete kar sakta hai
            });

            if(!reel) return res.status(400).json({msg: "Reel not found or you are not authorized to delete it."});

            res.json({ msg: 'Reel deleted successfully! 🗑️', reel });
        } catch (err: any) {
            return res.status(500).json({ msg: err.message });
        }
    }
};

export default reelCtrl;