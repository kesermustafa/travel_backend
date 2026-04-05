import reviewRepository from "../repositories/reviewRepository.js";
import { AppError } from "../errors/AppError.js";
import { ROLES } from "../constants/roles.js";
import {NotFoundError} from "../errors/NotFoundError.js";

class ReviewService {


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


    // * Belirli bir tura ait yorumları listeleme
    async getTourReviews(tourId) {
        return await reviewRepository.findByTourId(tourId, {
            sort: { createdAt: -1 },
            populate: { path: 'user', select: '_id name email photo' }
        });
    }


    async createReview(reviewData, userId) {
        reviewData.user = userId;

        // Yorum yapılırken kontrol et
        const hasBooked = await reviewRepository.checkUserBookedTour(
            reviewData.tour,
            userId
        );

        reviewData.isVerifiedPurchase = !!hasBooked;

        return await reviewRepository.create(reviewData);
    }


    async updateReview(reviewId, updateData, currentUser) {
        // Yetki kontrolü yapılır
        await this.handleReviewPermission(reviewId, currentUser);

        // Güvenlik: Yorumun asıl sahibi ve bağlı olduğu tur değiştirilemez
        delete updateData.user;
        delete updateData.tour;

        return await reviewRepository.update(reviewId, updateData);
    }


    async deleteReview(reviewId, currentUser) {
        // Yetki kontrolü yapılır
        await this.handleReviewPermission(reviewId, currentUser);

        return await reviewRepository.delete(reviewId);
    }

    async getReviewById(id){

        const review = await reviewRepository.findById(id);

        if (!review){
            throw new NotFoundError("Review not found")
        }

        return review;
    }


    /**
     * Tüm yorumları sayfalanabilir şekilde getirir
     * @param {Object} queryParams - req.query'den gelen (page, limit, sort vb.)
     */
    async getAllReviews(queryParams) {
        const { page, limit, sort, fields, ...filters } = queryParams;

        return await reviewRepository.findWithPagination(filters, {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 10,
            sort: sort || { createdAt: -1 },
            select: fields,
            populate: { path: 'user', select: '_id name email photo' }
        });
    }


}


export default new ReviewService();