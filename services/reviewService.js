import reviewRepository from "../repositories/reviewRepository.js";
import {AppError} from "../errors/AppError.js";
import {ROLES} from "../constants/roles.js";

class Review {

    async deleteReview (reviewId, currentUser) {
        const review = await reviewRepository.findById(reviewId);
        if (!review) throw new AppError("Yorum bulunamadı", 404);

        // Yetki: ADMIN her şeyi siler, USER sadece kendi yorumunu siler
        if (currentUser.role !== ROLES.ADMIN && review.user._id.toString() !== currentUser.id) {
            throw new AppError("Bu yorumu silme yetkiniz yok.", 403);
        }

        return await reviewRepository.delete(reviewId);
    };

    async createReview(reviewData, userId){
        // Yorum verisine kullanıcıyı ekle
        reviewData.user = userId;
        return await reviewRepository.create(reviewData);
    };



}

export default new Review();