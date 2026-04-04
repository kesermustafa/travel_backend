import { AppError } from "./AppError.js";

// Mongoose Hatalarını AppError'a Dönüştüren Yardımcı Fonksiyonlar
const handleCastErrorDB = (err) => {
    const message = `Geçersiz ${err.path}: ${err.value}.`;
    return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
    const value = Object.values(err.keyValue)[0];
    const message = `Kopyalanmış alan değeri: "${value}". Lütfen başka bir değer kullanın!`;
    return new AppError(message, 409);
};

const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Geçersiz girdi verisi. ${errors.join('. ')}`;
    return new AppError(message, 400);
};

const handleJWTError = () => new AppError('Geçersiz token. Lütfen tekrar giriş yapın!', 401);

const handleJWTExpiredError = () => new AppError('Oturum süreniz dolmuş! Lütfen tekrar giriş yapın.', 401);

// Yanıt Gönderme Fonksiyonları
const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
};

const sendErrorProd = (err, res) => {
    if (err.isOperational) {
        // Bizim tarafımızdan yakalanan ve "güvenli" dediğimiz hatalar
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    } else {
        // Kod hatası veya bilinmeyen sızıntılar
        console.error('💥 ERROR:', err);
        res.status(500).json({
            status: 'error',
            message: 'Bir şeyler ters gitti!'
        });
    }
};

export const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else {
        let error = { ...err };
        error.message = err.message;

        // Mongoose & JWT Hatalarını Yakala
        if (err.name === 'CastError') error = handleCastErrorDB(error);
        if (err.code === 11000) error = handleDuplicateFieldsDB(error);
        if (err.name === 'ValidationError') error = handleValidationErrorDB(error);
        if (err.name === 'JsonWebTokenError') error = handleJWTError();
        if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

        sendErrorProd(error, res);
    }
};