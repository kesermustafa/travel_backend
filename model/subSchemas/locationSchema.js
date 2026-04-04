import mongoose from "mongoose";

// Start Location için (Adres içeren)
export const startLocationSchema = new mongoose.Schema({
    description: String,
    type: { type: String, default: "Point", enum: ["Point"] },
    coordinates: [Number],
    address: String,
}, { _id: false });

// Tur Durakları için (Gün içeren)
export const tourLocationSchema = new mongoose.Schema({
    description: String,
    type: { type: String, default: "Point", enum: ["Point"] },
    coordinates: [Number],
    day: Number,
}, { _id: true });