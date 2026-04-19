import mongoose, { Schema, Document } from 'mongoose';

export interface IStory extends Document {
  user: mongoose.Types.ObjectId;
  image: string;
  audioUrl?: string; // 🔴 NAYA: Audio URL ke liye TS interface update kiya
  createdAt: Date;
}

const storySchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'user', required: true }, // ref 'user' rakha hai (make sure tumhare user model ka naam yahi ho)
  image: { type: String, required: true },
  audioUrl: { type: String, default: "" }, // 🔴 NAYA: Database mein audio link save karne ki jagah
  
  // 24 ghante baad apne aap delete hone ke liye index (86400 seconds = 24 hours)
  createdAt: { type: Date, default: Date.now, expires: 86400 } 
}, { timestamps: true });

export default mongoose.model<IStory>('Story', storySchema);