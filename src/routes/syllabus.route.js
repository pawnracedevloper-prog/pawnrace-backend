import express from 'express';
import { 
    addTechnique, 
    deleteTechnique, 
    updateTechnique, 
    getLevelContent 
} from '../controllers/syllabus.controller.js';

const router = express.Router();

router.get('/:level', getLevelContent);

router.post('/add', addTechnique);

router.put('/update', updateTechnique);


router.delete('/delete', deleteTechnique); 

export default router;