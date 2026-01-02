import { Router } from 'express';
import { getTournaments, createTournament } from '../controllers/tournament.controller.js';

const router = Router();

router.route('/')
    .get(getTournaments)
    .post(createTournament);

export default router;