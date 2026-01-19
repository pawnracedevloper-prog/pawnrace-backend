import "dotenv/config";
import http from "http";
import { Server } from "socket.io";

import connectDB from "./db/index.js";
import app from "./app.js";
import initSocket from "./sockets/chat.socket.js";

/* =========================================================
   IMPORT MODELS (ONCE)
   ========================================================= */
import "./models/user.model.js";
import "./models/course.model.js";
import "./models/technique.model.js";
import "./models/syllabus.model.js";
import "./models/assignment.model.js";
import "./models/submission.model.js";
import "./models/training-session.model.js";
import "./models/message.model.js";
import "./models/test.model.js";
import "./models/tournament.model.js";
import "./models/new_class.model.js";

/* =========================================================
   SERVER BOOTSTRAP
   ========================================================= */
connectDB()
    .then(() => {
        const server = http.createServer(app);

        const allowedOrigins = (process.env.CORS_ORIGIN || "")
            .split(",")
            .map(origin => origin.trim())
            .filter(Boolean);

        const io = new Server(server, {
            cors: {
                origin: allowedOrigins,
                credentials: true,
                methods: ["GET", "POST"]
            }
        });

        initSocket(io);

        const PORT = process.env.PORT || 8000;
        server.listen(PORT, () => {
            console.log(`🚀 API & Socket Server running on port ${PORT}`);
        });

        server.on("error", (err) => {
            console.error("Server error:", err);
        });
    })
    .catch((error) => {
        console.error("❌ Failed to start server:", error);
    });
