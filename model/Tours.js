import mongoose from "mongoose";
import { startLocationSchema, tourLocationSchema } from "./subSchemas/locationSchema.js";

const tourSchema = new mongoose.Schema({
    name: {type: String, required: [true, "Tour name is required"], trim: true, unique: true},
    price: {type: Number, required: true},
    priceDiscount: {type: Number,
        min:0, max:80,
        // custom validator (kendi yazdığımız kontrol methdoları)
        // doğrulama fonksiyonları false return ederse doğrulamadna geçmedi anlmaına gelir ve belge veritabanına kaydedilmez true return ederse doğrulamadan geçti anlamına gelir
        validate: {
            validator: function (value) {
                return value < 80;
            },
            message: "İndirim fiyatı 80 büyük olamaz",
        },
    },
    duration: {
        type: Number,
        required: [true, "Tur süre değerine sahip olmalı"],
    },

    maxGroupSize: {
        type: Number,
        required: [
            true,
            "Tur maksimum kişi sayısı değerine sahip olmalı",
        ],
    },
    difficulty: {type: String, required: true, enum: ["easy", "medium", "hard", "difficulty"]},
    ratingsAverage: {
        type: Number,
        min: [1, "Rating değeri 1'den küçük olamaz"],
        max: [5, "Rating değeri 5'den büyük olamaz"],
        default: 4.0,
    },
    ratingsQuantity: {type: Number, default: 0},

    summary: {
        type: String,
        maxLength: [200, "Özet alanı 200 karakteri geçemez"],
        required: [true, "Tur özet değerine sahip olmalı"],
    },
    description: {
        type: String,
        maxLength: [1000, "Açıklama alanı 1000 karakteri geçemez"],
        required: [true, "Tur açıklama değerine sahip olmalı"],
    },

    imageCover: {type: String, required: true},
    images: {type: [String]},
    startDates: {type: [Date]},
    durationHour: { type: Number },

    // Sadece adres bilgisi olan başlangıç noktası
    startLocation: startLocationSchema,

    // Gün bilgisi olan tur durakları dizisi
    locations: [tourLocationSchema],

    // 1. Turu oluşturan Yonetici (Tekil Referans)
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Turu olusturam bir Yonetici olmalı.']
    },

    updatedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    // 2. Turda görevli rehberler (Dizi Referans)
    guides: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    ]

}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform: (doc, ret) => {
            delete ret.__v;
        }
    },
    toObject: { virtuals: true },
});

tourSchema.pre(/^find/, function() {
    this.populate({
        path: 'createdBy',
        select: 'name email role photo'
    }).populate({
        path: 'guides',
        select: 'name email role photo'
    });
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
    let text = this.name.toLowerCase();

    const mapping = {
        'ı': 'i', 'ş': 's', 'ğ': 'g', 'ü': 'u', 'ö': 'o', 'ç': 'c',
        'İ': 'i', 'Ş': 's', 'Ğ': 'g', 'Ü': 'u', 'Ö': 'o', 'Ç': 'c'
    };

    // Türkçe karakterleri eşleştir ve değiştir
    Object.keys(mapping).forEach(key => {
        text = text.replaceAll(key, mapping[key]);
    });

    return text
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
});

tourSchema.virtual("reviews", {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
});

tourSchema.index({ price: 1, ratingsAverage: -1 });

const Tour = mongoose.model("Tour", tourSchema);
export default Tour;