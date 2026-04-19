import mongoose from "mongoose";
import { IPost } from "../config/interface";

const postSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      // 🔥 FIX: required: true hata diya taaki sirf pic bhi post ho sake
      trim: true,
      maxlength: 2200,
      default: "",
    },
    images: {
      type: Array,
      // 🔥 FIX: required: true hata diya taaki sirf text bhi post ho sake
      default: [],
    },
    music: {
      type: String, // 🔥 NAYA: Music URL save karne ke liye
      default: "",
    },
    mentions: {
      type: Array,  // 🔥 NAYA: Tagged users save karne ke liye
      default: [],
    },
    likes: [{ type: mongoose.Types.ObjectId, ref: "user" }],
    comments: [{ type: mongoose.Types.ObjectId, ref: "comment" }],
    user: { type: mongoose.Types.ObjectId, ref: "user" },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IPost>("post", postSchema);