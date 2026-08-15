import { Router } from 'express';
import { 
    createTest,
    deleteTest,
    getTestsForCourse,
    getTestById
} from '../controllers/test.controller.js';
import { verifyJWT, verifyRole } from '../middlewares/auth.middleware.js';

const router = Router();

// Coach: Create (Body: title, description, tasks[], timeLimit, rewardPoints)
// Shared: Get List (Student gets progress, Coach gets list)
router.route('/course/:courseId')
    .post(verifyJWT, verifyRole('coach'), createTest)
    .get(verifyJWT, getTestsForCourse);

// Shared: Get Single Test
// Coach: Delete
router.route('/:testId')
    .get(verifyJWT, getTestById)
    .delete(verifyJWT, verifyRole('coach'), deleteTest);

export default router;