import { Router } from 'express';
import {
    scheduleClass,
    updateClass,
    deleteClass,
    getClassesForCourse,
    getClassByRoomId
} from '../controllers/training-session.controller.js';
import { verifyJWT, verifyRole } from '../middlewares/auth.middleware.js';

const router = Router();

// Create a class (Internal Room ID required in body)
router.route("/course/:courseId").post(verifyJWT, verifyRole('coach'), scheduleClass);

// Update or Delete a specific class
router.route("/:classId")
    .patch(verifyJWT, verifyRole('coach'), updateClass)
    .delete(verifyJWT, verifyRole('coach'), deleteClass);

// Get list of classes
router.route("/course/:courseId").get(verifyJWT, getClassesForCourse);
router.route("/room/:roomId").get(verifyJWT, getClassByRoomId);


export default router;