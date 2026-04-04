// AppError.js güncel hali
export class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode; // Sayısal kod (404, 400 vb.)
        this.status = `${statusCode}`.startsWith("4") ? "fail" : "error"; // Metinsel durum
        this.isOperational = true; // Bu hata bizim tarafımızdan öngörülen bir hata mı?

        Error.captureStackTrace(this, this.constructor);
    }
}