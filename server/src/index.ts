import express from "express";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";

// Sare Routers Imports
import authRouter from "./routes/authRouter";
import userRouter from "./routes/userRouter";
import postRouter from "./routes/postRouter";
import commentRouter from "./routes/commentRouter";
import notificationRouter from "./routes/notificationRouter";
import conversationRouter from "./routes/conversationRouter";
import messagesRouter from "./routes/messagesRouter";
import storyRouter from "./routes/storyRoute"; 
import uploadImgRouter from "./routes/uploadImgRouter";
import reelRouter from "./routes/reelRouter"; 

import morgan from "morgan";
import dbConnect from "./config/dbConnect";
import { createServer } from "http";
import { Server } from "socket.io";
import SocketServer from "./socketServer";
import { ExpressPeerServer } from "peer";

// 1. Configuration load karein
dotenv.config();

// 2. Database Connection Call (Ye line sabse zaroori thi!)
dbConnect();

const app = express();
const PORT: string | number = process.env.PORT || 4000;

const httpServer = createServer(app);

// Socket.io setup
const io = new Server(httpServer, {
  cors: { 
    origin: ["https://intwit.vercel.app", "http://localhost:3000"], 
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"], 
    credentials: true
  },
  allowEIO3: true,
  transports: ['polling', 'websocket']
});

// CORS configuration
const corsOptions = {
  origin: ["https://intwit.vercel.app", "http://localhost:3000"],
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middlewares Setup
app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: false }));
app.use(cookieParser());
app.use(morgan("dev")); // Debugging ke liye morgan accha hai

// Socket Server Logic
io.on("connection", (socket) => {
  SocketServer(socket);
});

// Create peer Server
ExpressPeerServer(httpServer, { path: "/" });

// Base Route
app.get("/", (req, res) => {
  res.json({ message: "Server is running smoothly!" });
});

// Routes Registration
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/post", postRouter);
app.use("/api/comment", commentRouter);
app.use("/api/notification", notificationRouter);
app.use("/api/conversation", conversationRouter);
app.use("/api/messages", messagesRouter);
app.use("/api", storyRouter); 
app.use("/api/upload", uploadImgRouter);
app.use("/api", reelRouter); 

// Server Start
httpServer.listen(PORT, () => {
  console.log(`Server is running at PORT ${PORT}`);
});