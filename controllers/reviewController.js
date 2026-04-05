import reviewRepository from "../repositories/reviewRepository.js";
import reviewService from "../services/reviewService.js";

class ReviewController{

    async createReview (req, res) {

        //if (!req.body.tour) req.body.tour = req.params.tourId;
        //req.body.tour = req.body.tour || req.params.tourId;
        req.body.tour ??= req.params.tourId;

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

        console.log(req.params.tourId)

        const reviews = await reviewService.getTourReviews(req.params.tourId);

        res.status(200).json({
            status: 'success',
            results: reviews.length,
            data: reviews
        });
    };


    async getReview(req, res) {
        const review = await reviewService.getReviewById(req.params.id);
        res.status(200).json({
            status: "success",
            data: review
        });
    }


    async updateReview(req, res) {
        const updatedReview = await reviewService.updateReview(req.params.id, req.body, req.user);
        res.status(200).json({
            status: "success",
            data: updatedReview
        });
    }

    async getAllReviews (req, res)  {

        const result = await reviewService.getAllReviews(req.query);

        res.status(200).json({
            status: "success",
            total: result.total,
            results: result.data.length,
            page: result.page,
            pages: result.pages,
            data: result.data
        });
    };



}

export default new ReviewController;