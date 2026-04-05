
import bookingRepository from "../repositories/BookingRepository.js";
import tourRepository from "../repositories/toursRepository.js"; // Tours için yazdığın repo
import { AppError } from "../errors/AppError.js";
import { ROLES } from "../constants/roles.js";

class BookingService {
    /**
     * Yeni Rezervasyon Oluşturma
     */
    async createBooking(tourId, userId) {
        // 1) Turun varlığını ve fiyatını kontrol et
        const tour = await tourRepository.findById(tourId);
        if (!tour) throw new AppError("Tur bulunamadı.", 404);

        // 2) Kullanıcının bu turu daha önce alıp almadığını kontrol et (Opsiyonel)
        const existingBooking = await bookingRepository.findOne({ tour: tourId, user: userId });
        if (existingBooking) throw new AppError("Bu tura zaten rezervasyonunuz var.", 400);

        // 3) Rezervasyonu oluştur
        return await bookingRepository.create({
            tour: tourId,
            user: userId,
            price: tour.price, // Turun o anki fiyatını kaydediyoruz (fiyat değişse de fatura sabit kalır)
        });
    }

    /**
     * Rezervasyon Yetki Kontrolü
     */
    async handleBookingPermission(bookingId, currentUser) {
        const booking = await bookingRepository.findById(bookingId);
        if (!booking) throw new AppError("Rezervasyon bulunamadı.", 404);

        const isOwner = booking.user._id.toString() === currentUser.id;
        const isAdmin = currentUser.role === ROLES.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new AppError("Bu rezervasyona erişim yetkiniz yok.", 403);
        }
        return booking;
    }

    async getMyBookings(userId) {
        return await bookingRepository.findByUser(userId);
    }

    async cancelBooking(bookingId, currentUser) {
        const booking = await this.handleBookingPermission(bookingId, currentUser);

        // Silmek yerine statüsünü 'cancelled' yapabilirsin (Daha profesyoneldir)
        return await bookingRepository.update(bookingId, { status: "cancelled" });
    }
}

export default new BookingService();