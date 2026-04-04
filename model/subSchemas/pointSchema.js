import mongoose from "mongoose";

const pointSchema = new mongoose.Schema({
    type: {
        type: String,
        default: "Point",
        enum: ["Point"]
    },
    coordinates: {
        type: [Number],
        required: true
    },
    description: String
}, { _id: false });

export default pointSchema;