import BaseRepository from "./BaseRepository.js";
import Booking from "../model/Booking.js";

class BookingRepository extends BaseRepository {
    constructor() {
        super(Booking);
    }

    // Kullanıcının kendi rezervasyonlarını bulması için özel metod
    async findByUser(userId) {
        return await this.model.find({ user: userId });
    }

    async checkUserBookedTour(tourId, userId) {
        // Bu tur için bu kullanıcı adına "confirmed" bir rezervasyon var mı?
        return await this.model.exists({
            tour: tourId,
            user: userId,
            status: 'confirmed'
        });
    }
}

export default new BookingRepository();