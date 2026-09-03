import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { purchaseItem, equipItem } from "../controllers/shop.controller.js";

const router = Router();

// Both routes require the user to be logged in
router.route("/buy").post(verifyJWT, purchaseItem);
router.route("/equip").post(verifyJWT, equipItem);

export default router;