import mongoose from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { IUser } from "../config/interface";

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
      trim: true,
      maxlength: 25,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      maxlength: 25,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      // FIX: Yahan apna khud ka default avatar link dalein
      default: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
    },
    role: { type: String, default: "user" },
    gender: { type: String, default: "male" },
    mobile: { type: String, default: "" },
    address: { type: String, default: "" },
    story: {
      type: String,
      default: "",
      maxlength: 200,
    },
    website: { type: String, default: "" },
    faceBookId: { type: String, default: "" },

    followers: [{ type: mongoose.Types.ObjectId, ref: "user" }],
    following: [{ type: mongoose.Types.ObjectId, ref: "user" }],
    post: [{ type: mongoose.Types.ObjectId, ref: "post" }],
    saved: [{ type: mongoose.Types.ObjectId, ref: "post" }],
    
    blockedUsers: [{ type: mongoose.Types.ObjectId, ref: "user" }],
    isPrivate: { type: Boolean, default: false },

    // FIX: Password Reset ke liye ye fields hona zaroori hai
    passwordResetToken: String,
    passwordResetExpires: Date,

    token: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Password Hashing Middleware
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10); // Async version use kiya
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method: Password match karne ke liye
userSchema.methods.isPasswordMatched = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method: Reset Token banane ke liye
userSchema.methods.createPasswordResetToken = async function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
  return resetToken;
};

export default mongoose.model<IUser>("user", userSchema);