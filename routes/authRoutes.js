import express from "express";
import authController from "../controllers/authController.js";
import {requireAuth} from "../middleware/authMiddleware.js";



const router = express.Router();

router.post("/forgot-password", authController.forgotPassword);
router.patch("/reset-password/:token", authController.resetPassword);

router.route("/singup")
    .post(authController.register)

router.route("/login")
    .post(authController.login);


router.use(requireAuth);

router.route("/refresh")
    .post(authController.refresh)

router.route("/logout")
    .post(authController.logout)


export default router;