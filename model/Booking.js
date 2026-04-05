import mongoose, {Schema, model} from "mongoose";

const booking = new Schema(
    {
        tour: {
            type: Schema.ObjectId,
            ref: "Tour",
            required: [true, "Rezervasyon bir tura ait olmalıdır."],
        },
        user: {
            type: Schema.ObjectId,
            ref: "User",
            required: [true, "Rezervasyon bir kullanıcıya ait olmalıdır."],
        },
        price: {
            type: Number,
            required: [true, "Rezervasyon fiyatı belirtilmelidir."],
        },
        paid: {
            type: Boolean,
            default: true, // Şimdilik manuel/basit sistem varsayıyoruz
        },
        status: {
            type: String,
            enum: ["pending", "confirmed", "cancelled"],
            default: "confirmed",
        },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            versionKey: false,
            transform: (doc, ret) => {
                delete ret.__v;
                return ret;
            }
        },
        toObject: {virtuals: true}
    }
);


booking.pre(/^find/, function (next) {
    this.populate({path: "user", select: "name email _id photo"})
        .populate({path: "tour", select: "name price imageCover _id"});
    next();
});

const Booking = model("Booking", booking);
export default Booking;