import BaseRepository from "./BaseRepository.js";
import Review from "../model/Review.js";

class ReviewRepository extends BaseRepository {
    constructor() {
        super(Review);
    }


}

export default ReviewRepository;