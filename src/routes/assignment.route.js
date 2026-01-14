import { Router } from 'express';
import { 
    createAssignment,
    deleteAssignment,
    getAssignmentsForCourse,
    getAssignmentById
} from '../controllers/assignment.controller.js';
import { verifyJWT, verifyRole } from '../middlewares/auth.middleware.js';

const router = Router();

// Coach: Create (Body: title, description, tasks[])
router.route('/course/:courseId')
    .post(verifyJWT, verifyRole('coach'), createAssignment);

// Coach: Delete
router.route('/:assignmentId')
    .get(verifyJWT, getAssignmentById)
    .delete(verifyJWT, verifyRole('coach'), deleteAssignment);

// Shared: Get List (Student gets progress, Coach gets list)
router.route('/course/:courseId')
    .get(verifyJWT, getAssignmentsForCourse);

export default router;