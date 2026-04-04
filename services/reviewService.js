import reviewRepository from "../repositories/reviewRepository.js";
import { AppError } from "../errors/AppError.js";
import { ROLES } from "../constants/roles.js";

class ReviewService {
    /**
     * Review Yetki Kontrolü (Tam Versiyon)
     */
    async handleReviewPermission(reviewId, currentUser) {
        // 1) Yorumu, kullanıcısı ve tur sahibiyle birlikte getir
        const review = await reviewRepository.findReviewWithUser(reviewId);

        if (!review) {
            throw new AppError("İşlem yapılmak istenen yorum bulunamadı.", 404);
        }

        const userId = currentUser.id.toString();
        const userRole = currentUser.role;

        // Yorum sahibi bilgisi (Saf ID veya Nesne gelme ihtimaline karşı korumalı)
        const owner = review.user;
        const ownerId = owner?._id ? owner._id.toString() : owner?.toString();

        // --- YETKİ MATRİSİ ---

        // 1. Durum: ADMIN ise sınırsız yetki.
        if (userRole === ROLES.ADMIN) return review;

        // 2. Durum: Yorumun kendi sahibi ise.
        if (userId === ownerId) return review;

        // 3. Durum: LEAD_GUIDE ise ve bu yorum KENDİ oluşturduğu bir tura yapılmışsa.
        // Not: review.tour.createdBy'nin varlığını kontrol ediyoruz.
        if (userRole === ROLES.LEAD_GUIDE &&
            review.tour?.createdBy?.toString() === userId) {
            return review;
        }

        // Hiçbir şart sağlanmazsa yetki reddedilir.
        throw new AppError(`Bu yorum üzerinde işlem yapma yetkiniz yok. (Rolünüz: ${userRole})`, 403);
    }

    /**
     * Belirli bir tura ait yorumları listeleme
     */
    async getTourReviews(tourId) {
        return await reviewRepository.findByTourId(tourId, {
            sort: { createdAt: -1 },
            populate: { path: 'user', select: 'name photo' }
        });
    }

    /**
     * Yeni Yorum Oluşturma
     */
    async createReview(reviewData, userId) {
        reviewData.user = userId;
        return await reviewRepository.create(reviewData);
    }

    /**
     * Yorum Güncelleme
     */
    async updateReview(reviewId, updateData, currentUser) {
        // Yetki kontrolü yapılır
        await this.handleReviewPermission(reviewId, currentUser);

        // Güvenlik: Yorumun asıl sahibi ve bağlı olduğu tur değiştirilemez
        delete updateData.user;
        delete updateData.tour;

        return await reviewRepository.update(reviewId, updateData);
    }

    /**
     * Yorum Silme
     */
    async deleteReview(reviewId, currentUser) {
        // Yetki kontrolü yapılır
        await this.handleReviewPermission(reviewId, currentUser);

        return await reviewRepository.delete(reviewId);
    }
}


export default new ReviewService();