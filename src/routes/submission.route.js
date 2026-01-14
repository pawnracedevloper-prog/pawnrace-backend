import { Router } from 'express';
import {
    solveTask,
    reviewSubmission,
    getSubmissionsForAssignment
} from '../controllers/submission.controller.js';
import { verifyJWT, verifyRole } from '../middlewares/auth.middleware.js';

const router = Router();

// Student: Mark a specific puzzle as solved
router.route("/:assignmentId/solve").post(verifyJWT, verifyRole('student'), solveTask);

// Coach: Get all student submissions for an assignment
router.route("/:assignmentId/all").get(verifyJWT, verifyRole('coach'), getSubmissionsForAssignment);

// Coach: Give Review/Feedback
router.route("/:submissionId/review").patch(verifyJWT, verifyRole('coach'), reviewSubmission);

export default router;