import express from "express";
import reviewController from "../controllers/reviewController.js";
import {formatQuery} from "../middleware/queryFormater.js";

const router = express.Router();

router.route("/")
    .get(formatQuery, reviewController.getAllReviews)
    .post(reviewController.createReview)

router.route("/id")
    .get(reviewController.getReviews)
    .patch(reviewController.updateReview)
    .delete(reviewController.deleteReview)

export default router;