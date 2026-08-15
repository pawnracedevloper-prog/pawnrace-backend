import { Router } from 'express';
import { 
    startTest,
    solveTestTask,
    submitTest,
    getAttemptsForTest
} from '../controllers/test-submission.controller.js';
import { verifyJWT, verifyRole } from '../middlewares/auth.middleware.js';

const router = Router();

// Student: Start the test (Locks in the server startTime)
router.route('/:testId/start')
    .post(verifyJWT, startTest);

// Student: Save progress for a specific task within the test
router.route('/:testId/solve')
    .post(verifyJWT, solveTestTask);

// Student: Finalize and submit the test (Calculates & awards points)
router.route('/:testId/submit')
    .post(verifyJWT, submitTest);

// Coach: View all student attempts/submissions for a specific test
router.route('/:testId/attempts')
    .get(verifyJWT, verifyRole('coach'), getAttemptsForTest);

export default router;