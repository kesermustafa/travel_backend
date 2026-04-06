import multer from 'multer';

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    // Desteklenen formatları genişlettik
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Hatalı dosya tipi! Lütfen JPG, JPEG, PNG veya WEBP yükleyin.'), false);
    }
};

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
});

// Dinamik olarak istediğimiz alanları seçebilmek için export ediyoruz
export default upload;