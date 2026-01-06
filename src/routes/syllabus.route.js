import { Router } from 'express';
import { 
    addTechnique, 
    getSyllabusForCourse, 
    toggleTechniqueForCourse,
    getAllSyllabus,
    getGlobalSyllabus
} from '../controllers/syllabus.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// --- Global Management (Coach Database) ---
router.post('/add', verifyJWT, addTechnique);           // Add new card
router.get('/all', verifyJWT, getAllSyllabus);          // Get EVERYTHING (For Modal)
router.get('/level/:level', verifyJWT, getGlobalSyllabus); // Get specific level (For DB View)

// --- Course Specific (Classroom) ---
router.get('/course/:courseId', verifyJWT, getSyllabusForCourse); // Get Cards + Progress
router.patch('/course/toggle', verifyJWT, toggleTechniqueForCourse); // Mark Done/Undone

export default router;