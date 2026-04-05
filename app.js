import express from 'express';
import cors from "cors";
import helmet from 'helmet';
import cookieParser from "cookie-parser";
import rateLimit from 'express-rate-limit';
import xss from 'xss';
import hpp from 'hpp';

import toursRoutes from "./routes/toursRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { AppError } from "./errors/AppError.js";
import { globalErrorHandler } from "./errors/globalErrorHandler.js";
import bookingRouter from "./routes/bookingRouter.js";

const app = express();

// --- 1. EXPRESS AYARLARI ---
app.set('trust proxy', 1);

// --- 2. GÜVENLİK MIDDLEWARE'LERİ ---
app.use(helmet());

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        status: 'error',
        statusCode: 429,
        message: 'Çok fazla istek gönderdiniz, lütfen 15 dakika sonra tekrar deneyin.'
    }
});

const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 10,
    message: {
        status: 'error',
        statusCode: 429,
        message: 'Çok fazla giriş denemesi, lütfen 10 dakika sonra tekrar deneyin.'
    }
});

app.use('/api', limiter);
app.use('/api/auth', authLimiter);

// --- 3. PARSING ---
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// --- 4. SANITIZATION ---

// NoSQL Injection Koruması
const sanitizeInput = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    Object.keys(obj).forEach(key => {
        if (key.startsWith('$') || key.includes('.')) {
            delete obj[key];
        } else if (typeof obj[key] === 'object') {
            sanitizeInput(obj[key]);
        }
    });
};

// XSS Koruması
const sanitizeXSS = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'string') {
            obj[key] = xss(obj[key]);
        } else if (typeof obj[key] === 'object') {
            sanitizeXSS(obj[key]);
        }
    });
};

app.use((req, res, next) => {
    sanitizeInput(req.body);
    sanitizeInput(req.params);
    sanitizeXSS(req.body);
    next();
});

// HTTP Parameter Pollution Koruması
app.use(hpp({
    whitelist: ['price', 'ratingsAverage', 'duration', 'difficulty']
}));

// --- 5. REQUEST TIMEOUT ---
app.use((req, res, next) => {
    req.setTimeout(10000, () => {
        if (!res.headersSent) {
            next(new AppError('İstek zaman aşımına uğradı.', 408));
        }
    });
    next();
});

// --- 6. ROTALAR ---
app.use('/api/tours', toursRoutes);
app.use('/api/users', userRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/booking', bookingRouter);

app.all(/.*/, (req, res, next) => {
    next(new AppError(`Cannot find ${req.originalUrl} on this server!`, 404));
});

// --- 7. GLOBAL HATA YÖNETİMİ ---
app.use(globalErrorHandler);

export default app;