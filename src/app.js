import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const app = express();

app.use(helmet()); 

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,

    skip: (req) => {
        if (req.method === 'OPTIONS') return true;
        if (req.url.startsWith('/socket.io/')) return true;
        return false;
    },

    message: "Too many requests, please try again later."
});
app.use(limiter);

/* ===================== CORS (ONLY REAL FIX HERE) ===================== */
// 🔽 CHANGED: static origins instead of dynamic function
app.use(cors({
    origin: [
        "https://pawnrace.com",
        "https://www.pawnrace.com",
        "http://localhost:8080",
        "https://pawnrace-launchpad.vercel.app"
    ],
    credentials: true
}));
/* ==================================================================== */

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// --- Import Routers ---
import userRouter from "./routes/user.route.js";
import courseRouter from "./routes/course.route.js";
import assignmentRouter from "./routes/assignment.route.js";
import submissionRouter from "./routes/submission.route.js";
import trainingRouter from "./routes/training-session.route.js"; 
import chatRouter from "./routes/chat.route.js";
import testRouter from "./routes/test.route.js";
import tournamentRoutes from './routes/tournament.route.js';
import newclassRouter from './routes/new_class.route.js';
import syllabusRouter from './routes/syllabus.route.js';
import livekitRouter from './routes/livekit.route.js';

// --- Mount Routers ---
app.use("/api/v1/users", userRouter);
app.use("/api/v1/courses", courseRouter);
app.use("/api/v1/assignments", assignmentRouter);
app.use("/api/v1/submissions", submissionRouter);
app.use("/api/v1/training", trainingRouter); 
app.use("/api/v1/chats", chatRouter);
app.use("/api/v1/tests", testRouter);
app.use('/api/v1/tournaments', tournamentRoutes);
app.use('/api/v1/newclasses', newclassRouter);
app.use('/api/v1/syllabus', syllabusRouter);
app.use('/api/v1/livekit', livekitRouter);

// --- Global Error Handler ---
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    return res.status(statusCode).json({
        success: false,
        message: message,
        errors: err.errors || [],
    });
});

export default app;
