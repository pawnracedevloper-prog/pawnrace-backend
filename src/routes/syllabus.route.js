import { Router } from 'express';
import { 
    addTechnique, 
    addChapter, // <--- Import this
    getSyllabusForCourse, 
    toggleChapter, // <--- Renamed from toggleTechnique
    getAllSyllabus,
    getGlobalSyllabus
} from '../controllers/syllabus.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// Global / Authoring
router.post('/add', verifyJWT, addTechnique); // Create Container
router.post('/chapter/add', verifyJWT, addChapter); // Create Chapter

router.get('/all', verifyJWT, getAllSyllabus);
router.get('/level/:level', verifyJWT, getGlobalSyllabus);

// Course / Progress
router.get('/course/:courseId', verifyJWT, getSyllabusForCourse);
router.patch('/course/toggle', verifyJWT, toggleChapter); // Toggle Chapter

export default router;