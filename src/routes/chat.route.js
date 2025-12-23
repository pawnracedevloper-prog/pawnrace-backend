import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getCoachStudents,
  getConversation
} from "../controllers/chat.controller.js";

const router = Router();

router.use(verifyJWT);

// Coach students
router.get("/coach/students", getCoachStudents);

// Chat history (frontend passes only receiverId)
router.get("/conversation/:receiverId", getConversation);

export default router;
