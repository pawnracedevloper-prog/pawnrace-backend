import { Router } from 'express';
import {
    createAssignment,
    updateAssignment,
    deleteAssignment,
    getAssignmentsForCourse
} from '../controllers/assignment.controller.js';
import { verifyJWT, verifyRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.route("/course/:courseId").post(verifyJWT, verifyRole('coach'), createAssignment);

router.route("/:assignmentId")
    .patch(verifyJWT, verifyRole('coach'), updateAssignment)
    .delete(verifyJWT, verifyRole('coach'), deleteAssignment);
router.route("/course/:courseId").get(verifyJWT, getAssignmentsForCourse);


export default router;