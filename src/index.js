import 'dotenv/config';
import connectDB from "./db/index.js";
import app from "./app.js";
import http from 'http';
import { Server } from 'socket.io';
import initSocket from './sockets/chat.socket.js';

// Import models once to ensure Mongoose registers them
import './models/user.model.js';
import './models/course.model.js';
import './models/technique.model.js'; 
import './models/syllabus.model.js';
import './models/assignment.model.js';
import './models/submission.model.js';
import './models/class.model.js';
import './models/message.model.js';

connectDB()
.then(() => {
    // Create HTTP server from Express app
    const server = http.createServer(app);

    // Allowed frontend origins (Railway + local)
    const allowedOrigins = process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',')
        : ["http://localhost:8080"];

    // Attach Socket.IO to the same HTTP server
    const io = new Server(server, {
        cors: {
            origin: allowedOrigins,
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // Initialize socket logic
    initSocket(io);

    // Start server
    server.listen(process.env.PORT || 8000, () => {
        console.log(`🚀 API & Chat Server running on port ${process.env.PORT || 8000}`);
    });

    server.on("error", (err) => console.error("Server error:", err));
})
.catch((error) => console.error("Error starting server:", error));
