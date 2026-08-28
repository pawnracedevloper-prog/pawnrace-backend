import { Router } from 'express';
import {
    createCourse, updateCourse, deleteCourse, addStudentToCourse,
    removeStudentFromCourse, getMyCoursesAsCoach, getAllSyllabi,
    getAllCourses, getCourseById, getMyEnrolledCoursesAsStudent
} from '../controllers/course.controller.js';
import { verifyJWT, verifyRole } from '../middlewares/auth.middleware.js';

const router = Router();

// 1. ALL STATIC ROUTES MUST GO FIRST
router.route("/all").get(verifyJWT, getAllCourses);
router.route("/syllabi").get(verifyJWT, getAllSyllabi);
router.route("/coach/my-courses").get(verifyJWT, verifyRole('coach'), getMyCoursesAsCoach);
router.route("/student/my-courses").get(verifyJWT, verifyRole('student'), getMyEnrolledCoursesAsStudent);

// 2. COACH-ONLY CREATION (Technically static, safe here)
router.route("/").post(verifyJWT, verifyRole('coach'), createCourse);

// 3. DYNAMIC ROUTES GO AT THE VERY BOTTOM
router.route("/:courseId").get(verifyJWT, getCourseById);
router.route("/:courseId").patch(verifyJWT, verifyRole('coach'), updateCourse);
router.route("/:courseId").delete(verifyJWT, verifyRole('coach'), deleteCourse);
router.route("/:courseId/students").post(verifyJWT, verifyRole('coach'), addStudentToCourse);
router.route("/:courseId/students/:studentId").delete(verifyJWT, verifyRole('coach'), removeStudentFromCourse);

export default router;