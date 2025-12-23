import 'dotenv/config';
import connectDB from "./db/index.js";
import app from "./app.js";
import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from './models/user.model.js';
import { Message } from './models/message.model.js';

connectDB().then(() => {
  const server = http.createServer(app);

  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ["http://localhost:8080"];

  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true
    }
  });

  // userId -> socketId (v1 simple mapping)
  const userSocketMap = {};

  // 🔐 Socket authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) throw new Error("No token");

      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(decoded._id);

      if (!user) throw new Error("User not found");

      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();
    userSocketMap[userId] = socket.id;

    console.log(`✅ ${socket.user.username} connected`);

    // 📩 Send message
    socket.on("sendMessage", async (data, ack) => {
      try {
        const { receiverId, content } = data;

        // 🛡️ Validation
        if (!receiverId || !content?.trim()) return;
        if (receiverId === userId) return;

        const conversationId = [userId, receiverId].sort().join("_");

        const message = await Message.create({
          sender: userId,
          receiver: receiverId,
          content: content.trim(),
          conversationId
        });

        const payload = {
          _id: message._id,
          sender: userId,
          receiver: receiverId,
          content: message.content,
          createdAt: message.createdAt
        };

        // Emit to receiver
        const receiverSocket = userSocketMap[receiverId];
        if (receiverSocket) {
          io.to(receiverSocket).emit("receiveMessage", payload);
        }

        // Emit back to sender (important!)
        socket.emit("receiveMessage", payload);

        ack?.({ success: true });
      } catch (err) {
        ack?.({ success: false });
      }
    });

    socket.on("disconnect", () => {
      delete userSocketMap[userId];
      console.log(`🔥 ${socket.user.username} disconnected`);
    });
  });

  server.listen(process.env.PORT || 8000, () => {
    console.log("🚀 Server running");
  });
});
