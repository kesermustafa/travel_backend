import express from "express";
import reviewController from "../controllers/reviewController.js";
import {formatQuery} from "../middleware/queryFormater.js";
import {requireAuth, restrictTo} from "../middleware/authMiddleware.js";
import {ROLES, ROLES_LIST} from "../constants/roles.js";

const router = express.Router();

router.use(requireAuth);



router.route("/")
    .get(restrictTo(ROLES.ADMIN, ROLES.LEAD_GUIDE, ROLES.GUIDE),formatQuery, reviewController.getAllReviews)
    .post(restrictTo(...ROLES_LIST),reviewController.createReview)

router.use(restrictTo(...ROLES_LIST))

router.route("/id")
    .get(reviewController.getReviews)
    .patch(reviewController.updateReview)
    .delete(reviewController.deleteReview)

export default router;