import 'dotenv/config';
import connectDB from "./db/index.js";
import app from "./app.js"; // Note: It's conventional to name this 'app.js'
import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from './models/user.model.js';
import { Message } from './models/message.model.js';


import './models/user.model.js';
import './models/course.model.js';
import './models/technique.model.js'; 
import './models/syllabus.model.js';
import './models/assignment.model.js';
import './models/submission.model.js';
import './models/class.model.js';
// Connect to the database
connectDB()
.then(() => {
    // Create the main HTTP server from your Express app
    const server = http.createServer(app);

    // Get the list of allowed origins from your .env file
    const allowedOrigins = process.env.CORS_ORIGIN 
        ? process.env.CORS_ORIGIN.split(',') 
        : ["http://localhost:8080"]; // Default for local dev

    // Create and configure the Socket.IO server
    const io = new Server(server, {
        cors: {
            origin: allowedOrigins,
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // --- REAL-TIME CHAT LOGIC ---
    const userSocketMap = {}; // Maps: { userId -> socketId }

    // Middleware to authenticate every new socket connection
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error('Authentication Error: Token not provided.'));

        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
            if (err) return next(new Error('Authentication Error: Invalid Token.'));
            const user = await User.findById(decoded?._id);
            if (!user) return next(new Error('Authentication Error: User not found.'));
            socket.user = user; // Attach the authenticated user to the socket
            next();
        });
    });

    io.on('connection', (socket) => {
        const userId = socket.user._id.toString();
        userSocketMap[userId] = socket.id;
        console.log(`✅ User connected: ${socket.user.username} (${socket.id})`);

        socket.on('sendMessage', async (data) => {
            const { receiverId, content } = data;
            const senderId = socket.user._id;

            const conversationId = [senderId.toString(), receiverId].sort().join('_');
            const newMessage = await Message.create({ sender: senderId, receiver: receiverId, content, conversationId });
            
            const receiverSocketId = userSocketMap[receiverId];
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('receiveMessage', {
                    sender: senderId,
                    content: newMessage.content,
                    createdAt: newMessage.createdAt
                });
            }
        });

        socket.on('disconnect', () => {
            delete userSocketMap[userId];
            console.log(`🔥 User disconnected: ${socket.user.username}`);
        });
    });

    // Start the main server
    server.listen(process.env.PORT || 8000, () => {
        console.log(`🚀 API & Chat Server is running on port: ${process.env.PORT || 8000}`);
    });

    server.on("error", (err) => console.error("Server error:", err));
})
.catch((error) => console.error("Error starting server:", error));

