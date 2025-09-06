import { Router } from 'express';
import { getCoachsStudents, getConversationHistory } from '../controllers/chat.controller.js';
import { verifyJWT, verifyRole } from '../middlewares/auth.middleware.js';

const router = Router();

// A coach gets a list of their students
router.route('/students').get(verifyJWT, verifyRole('coach'), getCoachsStudents);

// Any authenticated user gets their chat history with another user
router.route('/history/:receiverId').get(verifyJWT, getConversationHistory);

export default router;
