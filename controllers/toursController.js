import toursRepository from "../repositories/toursRepository.js";
import Tour from "../model/Tours.js";
import toursService from "../services/toursService.js";
import catchAsync from "../utils/catchAsync.js";

class ToursController {

    async getAllTours(req, res, next) {
        try {

            const tours = await toursRepository.findAll(req.formatedQuery);

            res.status(200).json({
                results: tours.length, tours,
            });
        } catch (err) {
            next(err);
        }
    }

    getAllToursPageable = catchAsync(async (req, res, next) => {
        // Tüm req nesnesini veya gerekli alanları Service'e gönderiyoruz
        const result = await toursService.getPagedTours(req);

        res.status(200).json({
            status: "success",
            results: result.data.length,
            total: result.total,
            page: result.page,
            pages: result.pages,
            data: result.data,
        });
    });

    async getById(req, res) {
        try {
            const tour = await toursService.getSingleTour(req.params.id);

            if (!tour) {
                return res.status(404).json({
                    status: 'fail',
                    message: 'Tur bulunamadı'
                });
            }

            res.status(200).json({
                status: 'success',
                tour: tour
            });
        } catch (err) {
            res.status(500).json({ status: 'error', message: err.message });
        }
    }

    async create(req, res) {

        const tour = await toursService.createTour(req.body, req.user.id);

        res.status(201).json({
            status: "success",
            message: 'Tour Created Successfully',
            data: {
                tour: tour
            }
        });
    }

    async update(req, res, next) {
        try {
            const tourId = req.params.id;
            const updateData = req.body;
            const currentUser = req.user;

            const updatedTour = await toursService.updateTour(tourId, updateData, currentUser);

            res.status(200).json({
                status: 'success',
                message: 'Tour Updated Successfully',
                data: {
                    tour: updatedTour
                }
            });
        } catch (err) {
            next(err);
        }
    }


    async delete(req, res, next) {
        try {
            // req.user: Auth middleware'den gelen (login olmuş) kullanıcı
            // req.params.id: URL'den gelen tur ID'si
            await toursService.deleteTour(req.params.id, req.user);

            res.status(200).json({
                status: 'success',
                message: 'Tour Deleted Successfully'
            });
        } catch (err) {
            next(err);
        }
    }

    async getTourStatistics(req, res) {
        const stats = await Tour.aggregate([// 1. Adım: Ratingi 4 ve üzeri olan turları filtrele
            {$match: {ratingsAverage: {$gte: 4}}},

            // 2. Adım: Zorluğa göre gruplandır ve ham ortalamaları hesapla
            {
                $group: {
                    _id: "$difficulty",
                    count: {$sum: 1},
                    avgRating: {$avg: "$ratingsAverage"},
                    avgPrice: {$avg: "$price"},
                    minPrice: {$min: "$price"},
                    maxPrice: {$max: "$price"},
                },
            },

            // 3. Adım: Ondalık basamakları sınırla (4.666 -> 4.66)
            {
                $set: {
                    avgRating: {$trunc: ["$avgRating", 2]}, avgPrice: {$trunc: ["$avgPrice", 2]}
                }
            },

            // 4. Adım: Formatlanmış fiyata göre küçükten büyüğe sırala
            {$sort: {avgPrice: 1}},

            // 5. Adım: Ortalama fiyatı 500'den büyük olan grupları al
            {$match: {avgPrice: {$gte: 500}}},]);

        return res.status(200).json({
            status: "success", message: "Rapor Oluşturuldu", stats
        });
    }

    // todo belirli bir yıl için o yılın her ayında kaç tane ve hangi turlar başlayacak
    async getMonthlyPlan(req, res) {
        try {
            const year = Number(req.params.year);

            if (isNaN(year)) {
                return res.status(400).json({
                    status: 'fail', message: 'Geçersiz yıl parametresi',
                });
            }

            // Aggregation pipeline
            const stats = await Tour.aggregate([{$unwind: "$startDates"}, // startDates array'ini ayır
                {
                    $addFields: {
                        startDateObj: {$toDate: "$startDates"} // string ise Date'e çevir
                    }
                }, {
                    $match: {
                        startDateObj: {
                            $gte: new Date(`${year}-01-01T00:00:00Z`), $lte: new Date(`${year}-12-31T23:59:59Z`)
                        }
                    }
                }, {
                    $group: {
                        _id: {$month: "$startDateObj"}, count: {$sum: 1}, tours: {$push: "$name"}
                    }
                }, {$addFields: {month: "$_id"}}, {$project: {_id: 0}}, {$sort: {month: 1}}]);

            if (!stats || stats.length === 0) {
                return res.status(404).json({
                    status: 'fail', message: `${year} yılında herhangi bir tur başlamıyor`,
                });
            }

            res.status(200).json({
                status: 'success', message: `${year} yılı için aylık plan oluşturuldu`, stats
            });

        } catch (err) {
            res.status(500).json({
                status: 'error', message: err.message
            });
        }
    }

    // todo belirli koordinatlardaki turları filtrele
    async getToursWithin(req, res) {
        try {
            const { distance, latlng, unit } = req.params;

            // 1. Koordinatları ayır
            const [lat, lng] = latlng.split(",");

            // 2. Sayısal dönüşümleri yap
            const latitude = Number(lat);
            const longitude = Number(lng);
            const dist = Number(distance);

            // 3. Geçerlilik Kontrolleri (Validation)
            if (isNaN(latitude) || isNaN(longitude)) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Lütfen geçerli sayısal enlem ve boylam değerleri girin (Örn: 38.4,27.1)',
                });
            }

            if (isNaN(dist) || dist <= 0) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Mesafe (distance) pozitif bir sayı olmalıdır.',
                });
            }

            let radian;
            if (unit === 'mi' || unit === 'mil') {
                radian = dist / 3963.2; // Mil için dünya yarıçapı
            } else if (unit === 'km') {
                radian = dist / 6378.1; // Kilometre için dünya yarıçapı
            } else {
                // Eğer km, mi veya mil değilse hata döndür
                return res.status(400).json({
                    status: 'fail',
                    message: "Lütfen geçerli bir birim girin: 'km', 'mi' veya 'mil'.",
                });
            }


            // 5. MongoDB Sorgusu
            // [longitude, latitude] sırasına dikkat!
            const tours = await Tour.find({
                startLocation: {
                    $geoWithin: {
                        $centerSphere: [[longitude, latitude], radian],
                    },
                },
            });

            res.status(200).json({
                status: 'success',
                message: `${distance}'${unit} mesafede ${tours.length} tur bulundu `,
                results: tours.length,
                data: {
                   tours
                }
            });

        } catch (err) {
            res.status(500).json({
                status: 'error',
                message: err.message,
            });
        }
    }

    async getDistances(req, res) {
        try {
            const { latlng, unit } = req.params;

            // 1. Koordinatları ayır ve sayıya çevir
            const [lat, lng] = latlng.split(",");
            const latitude = Number(lat);
            const longitude = Number(lng);

            // 2. Geçerlilik kontrolü
            if (isNaN(latitude) || isNaN(longitude)) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Lütfen geçerli sayısal enlem ve boylam değerleri girin (Örn: 38,35)',
                });
            }

            // 3. Unit kontrolü ve Multiplier (Çarpan) belirleme
            // MongoDB varsayılan olarak METRE döner.
            let multiplier;
            if (unit === 'mi' || unit === 'mil') {
                multiplier = 0.000621371192;
            } else if (unit === 'km') {
                multiplier = 0.001;
            } else {
                return res.status(400).json({
                    status: 'fail',
                    message: "Lütfen geçerli bir birim girin: 'km', 'mi' veya 'mil'.",
                });
            }

            const distances = await Tour.aggregate([
                {
                    $geoNear: {
                        near: {
                            type: 'Point',
                            coordinates: [longitude, latitude]
                        },
                        distanceField: 'distance',
                        distanceMultiplier: multiplier,
                        spherical: true,
                    },
                },
                {
                    // $addFields kullanarak mevcut 'distance' alanını yuvarlayalım
                    $addFields: {
                        distance: { $round: ['$distance', 1] }
                    }
                },
                {
                    $project: {
                        name: 1,
                        distance: 1,
                    },
                },
            ]);

            res.status(200).json({
                status: 'success',
                message: `Turların merkeze olan uzaklıkları (${unit}) hesaplandı.`,
                results: distances.length,
                data: {
                    data: distances
                },
            });

        } catch (err) {
            res.status(500).json({
                status: 'error',
                message: 'Uzaklık hesaplanırken bir hata oluştu: ' + err.message,
            });
        }
    }


}

export default new ToursController();