import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getCoachStudents, getConversation } from "../controllers/chat.controller.js";

const router = Router();

// Apply authentication middleware to all chat routes
router.use(verifyJWT);

// Route to get students for a coach
// Matches frontend: /api/v1/chat/coach/:id/students
router.route("/coach/:coachId/students").get(getCoachStudents);

// Route to get conversation history
// Matches frontend: /api/v1/chat/conversation/:senderId/:receiverId
// Note: In your controller, we called parameters userId1 and userId2 for clarity, 
// but the route path needs to match what your frontend sends.
router.route("/conversation/:userId1/:userId2").get(getConversation);

export default router;