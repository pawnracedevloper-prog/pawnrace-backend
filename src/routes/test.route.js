import { Router } from 'express';
import { 
    createTest,
    deleteTest,
    getAllTestsForCourse
} from '../controllers/test.controller.js';
import { verifyJWT, verifyRole } from '../middlewares/auth.middleware.js';

const router = Router();

// --- Coach Routes ---

// A coach creates a test for a specific course
router.route('/course/:courseId')
    .post(verifyJWT, verifyRole('coach'), createTest);

// A coach deletes a specific test
router.route('/:testId')
    .delete(verifyJWT, verifyRole('coach'), deleteTest);

// --- Shared Route (Accessible by both Coach & Enrolled Students) ---

// Get all tests for a specific course
router.route('/course/:courseId')
    .get(verifyJWT, getAllTestsForCourse);

export default router;

