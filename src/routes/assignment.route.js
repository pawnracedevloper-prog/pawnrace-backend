import { Router } from 'express';
import { 
    createAssignment,
    deleteAssignment,
    getAssignmentsForCourse,
    updateAssignmentStatus
} from '../controllers/assignment.controller.js';
import { verifyJWT, verifyRole } from '../middlewares/auth.middleware.js';

const router = Router();

// --- Coach Routes ---

// A coach creates an assignment for a specific course
router.route('/course/:courseId')
    .post(verifyJWT, verifyRole('coach'), createAssignment);

// A coach deletes a specific assignment
router.route('/:assignmentId')
    .delete(verifyJWT, verifyRole('coach'), deleteAssignment);

// --- Student Routes ---

// A student updates the status of an assignment (e.g., marks as complete)
router.route('/:assignmentId/status')
    .patch(verifyJWT, verifyRole('student'), updateAssignmentStatus);

// --- Shared Route (Accessible by both Coach & Student) ---

// Both roles can get the list of assignments for a course
router.route('/course/:courseId')
    .get(verifyJWT, getAssignmentsForCourse);

export default router;

