import { Router } from 'express';
import {
    createCourse,
    updateCourse,
    deleteCourse,
    addStudentToCourse,
    removeStudentFromCourse,
    getMyCoursesAsCoach,
    getAllSyllabi,
    getAllCourses,
    getCourseById,
    getMyEnrolledCoursesAsStudent
} from '../controllers/course.controller.js';
import { verifyJWT, verifyRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.route("/all").get(verifyJWT, getAllCourses);
router.route("/syllabi").get(verifyJWT, getAllSyllabi);
router.route("/:courseId").get(verifyJWT, getCourseById);

// Coach-only Routes
router.route("/").post(verifyJWT, verifyRole('coach'), createCourse);
router.route("/:courseId").patch(verifyJWT, verifyRole('coach'), updateCourse);
router.route("/:courseId").delete(verifyJWT, verifyRole('coach'), deleteCourse);
router.route("/coach/my-courses").get(verifyJWT, verifyRole('coach'), getMyCoursesAsCoach);
router.route("/:courseId/students").post(verifyJWT, verifyRole('coach'), addStudentToCourse);
router.route("/:courseId/students/:studentId").delete(verifyJWT, verifyRole('coach'), removeStudentFromCourse);

// Student-only Routes
router.route("/student/my-courses").get(verifyJWT, verifyRole('student'), getMyEnrolledCoursesAsStudent);

export default router;