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
import './models/training-session.model.js';
import './models/message.model.js';
import './models/test.model.js';
import './models/tournament.model.js';
import './models/new_class.model.js';
import './models/test.submission.js';


connectDB()
.then(() => {
    const server = http.createServer(app);

    // 🔽 CHANGED: use explicit, stable origins (instead of env-split here)
    const allowedOrigins = [
        "https://pawnrace.com",
        "https://www.pawnrace.com",
        "http://localhost:5173"
    ];

    const io = new Server(server, {
        cors: {
            origin: allowedOrigins,
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    initSocket(io);

    server.listen(process.env.PORT || 8000, () => {
        console.log(`🚀 API & Chat Server running on port ${process.env.PORT || 8000}`);
    });

    server.on("error", (err) => console.error("Server error:", err));
})
.catch((error) => console.error("Error starting server:", error));
