import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    name: {}
})

const Review = mongoose.model("Review", reviewSchema);
export default Review;