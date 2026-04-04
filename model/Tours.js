import mongoose from "mongoose";
import validator from "validator";

const tourSchema = new mongoose.Schema({
    name: {type: String, required: [true, "Tour name is required"], trim: true, unique: true},
    duration: {type: Number, required: true},
    maxGroupSize: {type: Number, required: true},
    difficulty: {type: String, required: true, enum: ["easy", "medium", "hard", "difficulty"]},
    ratingsAverage: {type: Number, default: 4.5, min: 1, max: 5},
    ratingsQuantity: {type: Number, default: 0},
    price: {type: Number, required: true},
    summary: {type: String, trim: true, required: true},
    description: {type: String, trim: true},
    imageCover: {type: String, required: true},
    images: {type: [String]},
    startDates: {type: [Date]},
    priceDiscount: {type: Number,
        min:0, max:80,
        // custom validator (kendi yazdığımız kontrol methdoları)
        // doğrulama fonksiyonları false return ederse doğrulamadna geçmedi anlmaına gelir ve belge veritabanına kaydedilmez true return ederse doğrulamadan geçti anlamına gelir
        validate: {
            validator: function (value) {
                return value > 80;
            },
            message: "İndirim fiyatı 80 büyük olamaz",
        },
    },
}, {
    timestamps: true,
    toJSON: {
        virtual: true,
        versionKey: false,
        transform: (doc, ret) => {
            delete ret._id; // _id'yi gizle, virtual id kalsın
        }
    },
    toObject: { virtual: true },
});



//! Virtual Property
// Örn: Şuan veritbanında turların fiyatlarını ve indirim fiyatını tutuyoruz ama frontend bizden
// ayrıca indirimli fiyarıda istedi. Bu noktada indirimli fiyatı veritabanında tutmak gereksiz maaliyet olur.
// Bunun yerine cevap gönderme sırasında bu değeri hesaplyıp eklersek hem frontend'in ihtiyacını karşılamış oluruz
// hemde veritbanıdna gereksiz yer kaplamaz
tourSchema.virtual("finalPrice").get(function () {
    if (!this.priceDiscount) return this.price;

    if (this.priceDiscount > 80) return this.price; // aşırı indirim koruması

    const final = this.price - (this.price * this.priceDiscount / 100);
    return Number(final.toFixed(2));
});

// Örn: Şuan veritabanında tur ismini tutuyoruz ama client ekstra olarak slug istedi.
// The City Wanderer: the-city-wanderer
tourSchema.virtual("slug").get(function () {
    return this.name.replaceAll(" ", "-").toLowerCase();
});



const Tour = mongoose.model("Tour", tourSchema);
export default Tour;