import express from "express";
import toursController from "../controllers/toursController.js";
import {formatQuery} from "../middleware/queryFormater.js";
import {aliasTopTours} from "../middleware/aliasTopTours.js";
import {discountedTours} from "../middleware/discountedTours.js";
import {discounted20} from "../middleware/discounted20.js";

const router = express.Router();

router.route("/")
    .get(formatQuery, toursController.getAllTours)
    .post(toursController.create);

router.route("/pageable")
    .get(formatQuery, toursController.getAllToursPageable)

router.route("/top-tours")
    .get(aliasTopTours, formatQuery, toursController.getAllToursPageable)

router.route("/discounted-tours")
    .get(discountedTours, formatQuery, toursController.getAllToursPageable)

router.route("/discounted-20-tours")
    .get(discounted20, formatQuery, toursController.getAllToursPageable)

router.route("/statistics")
    .get(toursController.getTourStatistics)

router.route("/monthly/:year")
    .get(toursController.getMonthlyPlan)

router.route("/:id")
    .get(toursController.getById)
    .put(toursController.update)
    .delete(toursController.delete);

export default router;