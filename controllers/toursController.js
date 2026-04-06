import toursRepository from "../repositories/toursRepository.js";
import Tour from "../model/Tours.js";
import toursService from "../services/toursService.js";
import catchAsync from "../utils/catchAsync.js";
import upload from "../utils/multerUpload.js";
import { processSingleImage, processMultipleImages } from "../utils/imageHandler.js";


class ToursController {
    // --- RESİM YÜKLEME MIDDLEWARE ---
    // imageCover (1 adet) ve images (max 6 adet) alanlarını yakalar
    uploadTourPhotos = upload.fields([
        { name: 'imageCover', maxCount: 1 },
        { name: 'images', maxCount: 6 }
    ]);

    // --- RESİM İŞLEME YARDIMCI FONKSİYONU ---
    // Hem create hem update içinde kullanılabilir
    async _handleImages(req) {
        if (!req.files) return;

        // 1. Kapak fotoğrafı işleme
        if (req.files.imageCover) {
            req.body.imageCover = await processSingleImage(
                req.files.imageCover[0].buffer,
                'tours',
                [1200, null]
            );
        }

        // 2. Galeri fotoğrafları işleme
        if (req.files.images) {
            req.body.images = await processMultipleImages(
                req.files.images,
                'tours',
                [800, null]
            );
        }
    }

    getAllTours = catchAsync(async (req, res, next) => {
        const tours = await toursRepository.findAll(req.formatedQuery);
        res.status(200).json({ results: tours.length, tours });
    });

    getAllToursPageable = catchAsync(async (req, res, next) => {
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

    getById = catchAsync(async (req, res, next) => {
        const tour = await toursService.getSingleTour(req.params.id);
        if (!tour) return next(new Error('Tur bulunamadı')); // Custom error handler'a gönder
        res.status(200).json({ status: 'success', tour });
    });


    create = catchAsync(async (req, res, next) => {
        // Resimler varsa işle ve req.body'ye isimlerini yaz
        await this._handleImages(req);

        const tour = await toursService.createTour(req.body, req.user.id);

        res.status(201).json({
            status: "success",
            message: 'Tour Created Successfully',
            data: { tour }
        });
    });


    update = catchAsync(async (req, res, next) => {
        // Yeni resimler geldiyse işle
        await this._handleImages(req);

        const updatedTour = await toursService.updateTour(req.params.id, req.body, req.user);

        if (!updatedTour) {
            return next(new Error('Bu ID ile bir tur bulunamadı!'));
        }


        res.status(200).json({
            status: 'success',
            message: 'Tour Updated Successfully',
            data: { tour: updatedTour }
        });
    });

    delete = catchAsync(async (req, res, next) => {
        await toursService.deleteTour(req.params.id, req.user);
        res.status(200).json({ status: 'success', message: 'Tour Deleted Successfully' });
    });

    deleteTourImage = catchAsync(async (req, res, next) => {
        const updatedTour = await toursService.deleteImage(
            req.params.id,
            req.params.filename,
            req.user
        );

        res.status(200).json({
            status: 'success',
            message: 'Resim başarıyla temizlendi.',
            data: { tour: updatedTour }
        });
    });

    // İstatistik ve Planlama metodlarını catchAsync ile sarmalayarak try-catch kalabalığından kurtulalım
    getTourStatistics = catchAsync(async (req, res, next) => {
        const stats = await Tour.aggregate([
            { $match: { ratingsAverage: { $gte: 4 } } },
            {
                $group: {
                    _id: "$difficulty",
                    count: { $sum: 1 },
                    avgRating: { $avg: "$ratingsAverage" },
                    avgPrice: { $avg: "$price" },
                    minPrice: { $min: "$price" },
                    maxPrice: { $max: "$price" },
                },
            },
            {
                $set: {
                    avgRating: { $trunc: ["$avgRating", 2] },
                    avgPrice: { $trunc: ["$avgPrice", 2] }
                }
            },
            { $sort: { avgPrice: 1 } },
            { $match: { avgPrice: { $gte: 500 } } }
        ]);

        res.status(200).json({ status: "success", stats });
    });

    getMonthlyPlan = catchAsync(async (req, res, next) => {
        const year = Number(req.params.year);
        if (isNaN(year)) return next(new Error('Geçersiz yıl parametresi'));

        const stats = await Tour.aggregate([
            { $unwind: "$startDates" },
            { $addFields: { startDateObj: { $toDate: "$startDates" } } },
            {
                $match: {
                    startDateObj: {
                        $gte: new Date(`${year}-01-01`),
                        $lte: new Date(`${year}-12-31`)
                    }
                }
            },
            {
                $group: {
                    _id: { $month: "$startDateObj" },
                    count: { $sum: 1 },
                    tours: { $push: "$name" }
                }
            },
            { $addFields: { month: "$_id" } },
            { $project: { _id: 0 } },
            { $sort: { month: 1 } }
        ]);

        res.status(200).json({ status: 'success', stats });
    });

    getToursWithin = catchAsync(async (req, res, next) => {
        const { distance, latlng } = req.params;
        const unit = req.params.unit || 'km';

        const [lat, lng] = latlng.split(",");
        const latitude = Number(lat);
        const longitude = Number(lng);
        const dist = Number(distance);

        if (isNaN(latitude) || isNaN(longitude)) return next(new Error('Geçerli koordinat girin'));

        const radian = unit === 'mi' || unit === 'mil' ? dist / 3963.2 : dist / 6378.1;

        const tours = await Tour.find({
            startLocation: {
                $geoWithin: {
                    $centerSphere: [[longitude, latitude], radian],
                },
            },
        });

        res.status(200).json({
            status: 'success',
            results: tours.length,
            data: { tours }
        });
    });

    getDistances = catchAsync(async (req, res, next) => {
        const { latlng } = req.params;
        const unit = req.params.unit || 'km';

        const [lat, lng] = latlng.split(",");
        const latitude = Number(lat);
        const longitude = Number(lng);

        const multiplier = (unit === 'mi' || unit === 'mil') ? 0.000621371 : 0.001;

        const distances = await Tour.aggregate([
            {
                $geoNear: {
                    near: { type: 'Point', coordinates: [longitude, latitude] },
                    distanceField: 'distance',
                    distanceMultiplier: multiplier,
                    spherical: true,
                },
            },
            { $addFields: { distance: { $round: ['$distance', 1] } } },
            {
                $project: {
                    _id: 0,
                    id: '$_id',
                    name: 1,
                    distance: 1,
                    ratingsAverage: 1,
                    finalPrice: {
                        $round: [
                            {
                                $subtract: [
                                    '$price',
                                    { $multiply: ['$price', { $divide: [{ $ifNull: ['$priceDiscount', 0] }, 100] }] }
                                ]
                            },
                            2
                        ]
                    }
                }
            }
        ]);

        res.status(200).json({ status: 'success', data: { data: distances } });
    });
}

export default new ToursController();