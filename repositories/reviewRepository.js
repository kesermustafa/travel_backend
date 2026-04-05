import BaseRepository from "./BaseRepository.js";
import Review from "../model/Review.js";

class ReviewRepository extends BaseRepository {
    constructor() {
        super(Review);
    }


    async findReviewWithUser(id) {
        return await this.model.findById(id)
            .populate({
                path: 'user',
                select: 'name photo role'
            })
            .populate({
                path: 'tour',
                select: 'name createdBy'
            });
    }


    async findByTourId(tourId, options = {}) {
        return await this.findAll({ tour: tourId }, options);
    }

    async checkUserBookedTour(tourId, userId) {
        const booking = await this.model.findOne({
            tour: tourId,
            user: userId
        });
        return !!booking;
    }

}

export default new ReviewRepository();