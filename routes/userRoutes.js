
import express from "express";
import userController from "../controllers/userController.js";
import { formatQuery } from "../middleware/queryFormater.js";
import { requireAuth, restrictTo } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * Public endpoint
 */



/**
 * Auth required
 */
router.use(requireAuth);

/**
 * USER + ADMIN endpointleri
 */
router.use(restrictTo("ADMIN", "USER"));

router.get("/me", userController.getMyProfile);
router.patch("/me/update", userController.updateMe);
router.patch("/me/update-password", userController.updatePassword);
router.delete("/me/delete", userController.deleteMe);


/**
 * Tüm alt rotalar ADMIN yetkisi gerektirir
 */
router.use(restrictTo("ADMIN"));

// Ana dizin işlemleri
router.route("/")
    .get(formatQuery, userController.getAllUsers)
    .post(userController.createUser);

// ID bazlı işlemler (Gereksiz "/admin" takısını kaldırdık)
router.route("/:id")
    .get(userController.getUserById)
    .patch(userController.updateUser)
    .delete(userController.deleteUser);

// Özel aramalar
router.get("/find-email/:email", userController.getUserByEmail);

export default router;

