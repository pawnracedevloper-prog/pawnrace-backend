import { Router } from 'express';
import { 
    getTournaments, 
    createTournament, 
    deleteTournament, 
    markTournamentCompleted 
} from '../controllers/tournament.controller.js';

const router = Router();

router.route('/')
    .get(getTournaments)
    .post(createTournament);

router.route('/:id')
    .delete(deleteTournament); // Delete route

router.route('/:id/complete')
    .put(markTournamentCompleted); // Mark completed route

export default router;