import mongoose, {Schema, model} from "mongoose";

import Tour from "./Tours.js";

const reviewSchema = new Schema(
    {
        review: {
            type: String,
            required: [true, "Yorum içeriği boş olamaz"],
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
            required: [true, "Puan değeri tanımlanmalı"],
        },
        tour: {
            type: Schema.ObjectId,
            ref: "Tour",
            required: [true, "Yorumun hangi tur için atıldığını belirtin"],
        },
        user: {
            type: Schema.ObjectId,
            ref: "User",
            required: [true, "Yorumu hangi kullanıcının attığını belirtin"],
        },

        isVerifiedPurchase: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true,
            transform: (doc, ret) => {
                delete ret.__v;
                return ret;
            }
        },
        toObject: { virtuals: true }
    }
);

// 1) Tekil İndeks: Bir kullanıcı bir tura sadece 1 yorum yapabilir
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// 2) Populate Middleware
reviewSchema.pre(/^find/, function () {
    this.populate({
        path: "user",
        select: "_id email name photo"
    });
});

// 3) Statik Metot: Rating Hesaplama
reviewSchema.statics.calcAverage = async function (tourId) {

    const stats = await this.aggregate([
        { $match: { tour: tourId } },
        {
            $group: {
                _id: "$tour",
                nRating: { $sum: 1 },
                avgRating: { $avg: "$rating" },
            },
        },
    ]);

    const updateData = stats.length > 0
        ? {
            ratingsAverage: Math.round(stats[0].avgRating * 10) / 10, // 4.6666 -> 4.7 yapar
            ratingsQuantity: stats[0].nRating
        }
        : { ratingsAverage: 4.5, ratingsQuantity: 0 };

    await Tour.findByIdAndUpdate(tourId, updateData);
};

// 4) Kayıt sonrası tetikleme
reviewSchema.post("save", function () {
    this.constructor.calcAverage(this.tour);
});

// 5) Güncelleme ve Silme sonrası tetikleme
reviewSchema.post(/^findOneAnd/, async function (doc) {
    if (doc) await doc.constructor.calcAverage(doc.tour);
});


const Review = mongoose.model("Review", reviewSchema);
export default Review;