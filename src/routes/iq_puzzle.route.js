import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { submitIqScore, getMyIqStats } from "../controllers/iq_puzzle.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/submit").post(submitIqScore);
router.route("/stats").get(getMyIqStats);

export default router;