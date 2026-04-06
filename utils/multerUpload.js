import multer from 'multer';
import {AppError} from "../errors/AppError.js";

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    // Desteklenen formatlar
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new AppError('Hatalı dosya tipi! Lütfen JPG, JPEG, PNG veya WEBP yükleyin.', 400), false);
    }
};

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});


export default upload;