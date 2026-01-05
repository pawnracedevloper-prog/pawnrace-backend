import express from 'express';
import { 
    addTechnique, 
    deleteTechnique, 
    updateTechnique, 
    getLevelContent,
    getTechniques,
    markTechniqueAsCompleted 
} from '../controllers/syllabus.controller.js';

const router = express.Router();

router.get('/all', getTechniques);
router.post('/add', addTechnique);
router.delete('/delete', deleteTechnique);
router.put('/update', updateTechnique);
router.patch('/complete', markTechniqueAsCompleted);
router.get('/:level', getLevelContent);

export default router;