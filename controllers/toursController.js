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
            // parametrelere eriş
            const {distance, latlng, unit} = req.params;

            // enlem ve boylamı ayır
            const [lat, lng] = latlng.split(",");

            // merkez noktası yoksa hata
            if (!lat || !lng) {
                return res.status(400).json({
                    status: 'fail', message: 'Lütfen merkez noktasını belirleyin',
                });
            }

            // radius hesaplama (radyan cinsinden)
            const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

            // belirlenen dairesel alandaki turları filtrele
            const tours = await Tour.find({
                startLocation: {
                    $geoWithin: {
                        $centerSphere: [[parseFloat(lng), parseFloat(lat)], radius], // ⚠️ dikkat: GeoJSON formatında [lng, lat] sırası kullanılmalı
                    },
                },
            });

            res.status(200).json({
                status: 'success', message: 'Sınırlar içerisindeki turlar alındı', results: tours.length, tours,
            });
        } catch (err) {
            res.status(500).json({
                status: 'error', message: err.message,
            });
        }
    }

    async getDistances(req, res) {
        try {
            // URL parametreleri
            const {latlng, unit} = req.params;

            // enlem ve boylamı ayır
            const [lat, lng] = latlng.split(",");

            // enlem veya boylam yoksa hata
            if (!lat || !lng) {
                return res.status(400).json({
                    status: 'fail', message: 'Lütfen merkez noktayı tanımlayın',
                });
            }

            // unit'e göre multiplier (mi veya km)
            const multiplier = unit === 'mi' ? 0.000621371192 : 0.001;

            // GeoNear aggregation pipeline
            const distances = await Tour.aggregate([{
                $geoNear: {
                    near: {type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)]},
                    distanceField: 'distance',
                    distanceMultiplier: multiplier,
                    spherical: true, // 2dsphere index için önemli
                },
            }, {
                $project: {
                    name: 1, distance: 1,
                },
            },]);

            res.status(200).json({
                status: 'success', message: 'Uzaklıklar hesaplandı', results: distances.length, distances,
            });

        } catch (err) {
            res.status(500).json({
                status: 'error', message: err.message,
            });
        }
    }


}

export default new ToursController();