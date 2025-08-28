import { Router } from 'express';
import {
    scheduleClass,
    updateClass,
    deleteClass,
    getClassesForCourse
} from '../controllers/class.controller.js';
import { verifyJWT, verifyRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.route("/course/:courseId").post(verifyJWT, verifyRole('coach'), scheduleClass);
router.route("/:classId")
    .patch(verifyJWT, verifyRole('coach'), updateClass)
    .delete(verifyJWT, verifyRole('coach'), deleteClass);

router.route("/course/:courseId").get(verifyJWT, getClassesForCourse);

export default router;