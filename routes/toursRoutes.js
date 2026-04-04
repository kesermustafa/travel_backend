import express from "express";
import toursController from "../controllers/toursController.js";
import {formatQuery} from "../middleware/queryFormater.js";
import {aliasTopTours} from "../middleware/aliasTopTours.js";
import {discountedTours} from "../middleware/discountedTours.js";
import {discounted20} from "../middleware/discounted20.js";
import {requireAuth, restrictTo} from "../middleware/authMiddleware.js";
import {ROLES, ROLES_LIST} from "../constants/roles.js";

const router = express.Router();


router.route("/pageable")
    .get(formatQuery, toursController.getAllToursPageable)

router.route("/top-tours")
    .get(aliasTopTours, formatQuery, toursController.getAllToursPageable)

router.route("/discounted-tours")
    .get(discountedTours, formatQuery, toursController.getAllToursPageable)

router.route("/discounted-20-tours")
    .get(discounted20, formatQuery, toursController.getAllToursPageable)


router.use(requireAuth);

router.route("/statistics")
    .get(restrictTo(ROLES.ADMIN, ROLES.LEAD_GUIDE, ROLES.GUIDE), toursController.getTourStatistics)

router.route("/monthly/:year")
    .get(restrictTo(ROLES.ADMIN, ROLES.LEAD_GUIDE, ROLES.GUIDE), toursController.getMonthlyPlan)

router.route("/")
    .get(restrictTo(...ROLES_LIST),formatQuery, toursController.getAllTours)
    .post(restrictTo(ROLES.ADMIN, ROLES.LEAD_GUIDE, ROLES.GUIDE), toursController.create);

router.route("/:id")
    .get(restrictTo(...ROLES_LIST), toursController.getById)
    .put(restrictTo(ROLES.ADMIN, ROLES.LEAD_GUIDE, ROLES.GUIDE), toursController.update)
    .delete(restrictTo(ROLES.ADMIN, ROLES.LEAD_GUIDE, ROLES.GUIDE), toursController.delete);

export default router;