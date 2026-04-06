import express from "express";
import userController from "../controllers/userController.js";
import { formatQuery } from "../middleware/queryFormater.js";
import { requireAuth, restrictTo } from "../middleware/authMiddleware.js";
import { ROLES, ROLES_LIST } from '../constants/roles.js';
import upload from "../utils/multerUpload.js";

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
router.use(restrictTo(...ROLES_LIST));

router.get("/me", userController.getMyProfile);
router.patch("/me/update", upload.single('photo'), userController.updateMe);
router.patch("/me/update-password", userController.updatePassword);
router.delete("/me/delete", userController.deleteMe);


/**
 * Tüm alt rotalar ADMIN yetkisi gerektirir
 */
router.use(restrictTo(ROLES.ADMIN, ROLES.LEAD_GUIDE, ROLES.GUIDE));

// Ana dizin işlemleri
router.route("/")
    .get(formatQuery, userController.getAllUsers)

router.use(restrictTo("ADMIN"));

router.route("/")
    .post(userController.createUser);

router.route("/:id")
    .get(userController.getUserById)
    .patch(userController.updateUser)
    .delete(userController.deleteUser);

// Özel aramalar
router.get("/find-email/:email", userController.getUserByEmail);

export default router;

