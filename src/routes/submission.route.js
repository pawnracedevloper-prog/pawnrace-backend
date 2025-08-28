import { Router } from 'express';
import {
    createSubmission,
    reviewSubmission,
    getSubmissionsForAssignment
} from '../controllers/submission.controller.js';
import { verifyJWT, verifyRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.route("/assignment/:assignmentId").post(verifyJWT, verifyRole('student'), createSubmission);
router.route("/assignment/:assignmentId").get(verifyJWT, getSubmissionsForAssignment);
router.route("/:submissionId/review").patch(verifyJWT, verifyRole('coach'), reviewSubmission);

export default router;