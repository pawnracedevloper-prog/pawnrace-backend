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


// --- START OF DIAGNOSTIC CORS CONFIGURATION ---

// 1. Log the raw environment variable to see what Render is providing.
console.log("Reading CORS_ORIGIN from environment:", process.env.CORS_ORIGIN);

// 2. Safely parse the environment variable into an array.
//    The `|| ''` prevents a crash if the variable is missing.
const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(origin => origin.trim());

// 3. Log the final array that will be used for the CORS check.
console.log("Server configured with Allowed CORS Origins:", allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    // This logic is correct. It will check if the incoming `origin` is in our `allowedOrigins` array.
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.error(`CORS Blocked: Origin '${origin}' is not in the allowed list.`);
      callback(new Error('This origin is not allowed by CORS'));
    }
  },
  credentials: true // Crucial for cookies
};

// 4. IMPORTANT: Ensure this line is placed BEFORE your API routes (app.use('/api/v1/...')).
app.use(cors(corsOptions));

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
import chatRouter from "./routes/chat.route.js";
import testRouter from "./routes/test.route.js";

// --- Mount Routers ---
app.use("/api/v1/users", userRouter);
app.use("/api/v1/courses", courseRouter);
app.use("/api/v1/assignments", assignmentRouter);
app.use("/api/v1/submissions", submissionRouter);
app.use("/api/v1/classes", classRouter); 
app.use("/api/v1/chats", chatRouter);
app.use("/api/v1/tests", testRouter);

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