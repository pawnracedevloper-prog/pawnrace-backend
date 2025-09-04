import { Router } from 'express';
import {
    registerUser,
    userlogin,
    userlogout,
    refreshTokenHandler,
    changePassword,
    forgotPassword,
    resetPassword,
    updateProfile
} from '../controllers/user.controller.js';
import { upload } from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// Unsecured Routes
router.route("/register").post(registerUser);
router.route("/login").post(userlogin);
router.route("/refresh-token").post(refreshTokenHandler);
router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password/:token").post(resetPassword);


// Secured Routes (require JWT)
router.route("/logout").post(verifyJWT, userlogout);
router.route("/change-password").post(verifyJWT, changePassword);
router.route("/update-profile").patch(verifyJWT, updateProfile);

export default router;