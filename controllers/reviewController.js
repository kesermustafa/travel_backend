import reviewRepository from "../repositories/reviewRepository.js";
import reviewService from "../services/reviewService.js";

class ReviewController{

    async createReview (req, res) {
        const newReview = await reviewService.createReview(req.body, req.user.id);
        res.status(201).json({
            status: "success",
            data: newReview
        });
    };

    async deleteReview  (req, res)  {
        await reviewService.deleteReview(req.params.id, req.user);
        res.status(204).json({
            status: "success",
            message: "Yorum başarıyla silindi"
        });
    };


    async getTourReviews (req, res) {
        const reviews = await reviewService.getTourReviews(req.params.tourId);

        res.status(200).json({
            status: 'success',
            results: reviews.length,
            data: reviews
        });
    };


    async getAllReviews() {}

    async getReview(req, res) {}

    async updateReview(req, res) {}

    async getReviews(req, res) {}

}

export default new ReviewController;