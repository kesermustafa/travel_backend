
import bookingService from "../services/BookingService.js";

export const checkout = async (req, res) => {
    // TourId body'den veya URL'den gelebilir
    const newBooking = await bookingService.createBooking(req.params.tourId, req.user.id);

    res.status(201).json({
        status: "success",
        data: newBooking,
    });
};

export const getMyBookings = async (req, res) => {
    const bookings = await bookingService.getMyBookings(req.user.id);

    res.status(200).json({
        status: "success",
        results: bookings.length,
        data: bookings,
    });
};