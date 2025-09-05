import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const app = express();

app.use(helmet()); 

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    standardHeaders: true,
    legacyHeaders: false, 
});
app.use(limiter); // Apply rate limiting to all requests
// --- End of Security Middleware ---


const allowedOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',') 
    : ["http://localhost:8080"]; // A default for safety

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(express.static("public"));
app.use(cookieParser());


// --- Import Routers ---
import userRouter from "./routes/user.route.js";
import courseRouter from "./routes/course.route.js";
import assignmentRouter from "./routes/assignment.route.js";
import submissionRouter from "./routes/submission.route.js";
import classRouter from "./routes/class.route.js"; 

// --- Mount Routers ---
app.use("/api/v1/users", userRouter);
app.use("/api/v1/courses", courseRouter);
app.use("/api/v1/assignments", assignmentRouter);
app.use("/api/v1/submissions", submissionRouter);
app.use("/api/v1/classes", classRouter); 


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