import express from "express";
import * as bookingController from "../controllers/bookingController.js";
import { requireAuth, restrictTo } from "../middleware/authMiddleware.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

router.use(requireAuth);


// Tur detay sayfasından gelen rezervasyon isteği
router.post("/checkout/:tourId", bookingController.checkout);


// Kullanıcının kendi rezervasyonlarını görmesi
router.get("/my-bookings", bookingController.getMyBookings);

export default router;