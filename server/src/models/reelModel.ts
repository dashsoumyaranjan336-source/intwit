import mongoose, { Document, Schema } from 'mongoose';

// TypeScript ke liye interface
export interface IReel extends Document {
  user: mongoose.Types.ObjectId;
  videoUrl: string;
  audioUrl?: string;
  filterName: string;
  caption?: string;
  likes: mongoose.Types.ObjectId[];
  views: number;
}

// Mongoose Schema
const reelSchema: Schema = new Schema({
  user: { type: mongoose.Types.ObjectId, ref: 'user' },
  videoUrl: { type: String, required: true },
  audioUrl: { type: String, default: '' },
  filterName: { type: String, default: 'filter-none' },
  caption: { type: String, default: '' },
  likes: [{ type: mongoose.Types.ObjectId, ref: 'user' }],
  views: { type: Number, default: 0 }
}, {
  timestamps: true // Ye automatically createdAt aur updatedAt add kar dega
});

export default mongoose.model<IReel>('reel', reelSchema);