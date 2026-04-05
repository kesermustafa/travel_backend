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
                select: 'role _id name'
            })
            .populate({
                path: 'tour',
                select: 'createdBy' // Turun sahibini (Lead Guide mı?) kontrol etmek için
            });
    }

    async findByTourId(tourId, options = {}) {
        return await this.findAll({ tour: tourId }, options);
    }

}

export default new ReviewRepository();