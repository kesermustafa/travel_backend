import express from 'express';
import cors from "cors";
import toursRoutes from "./routes/toursRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import {AppError} from "./errors/AppError.js";
import {globalErrorHandler} from "./errors/globalErrorHandler.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import cookieParser from "cookie-parser";


const app = express();
app.use(express.json());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(cookieParser());

app.set('trust proxy', true);

app.set("query parser", "extended");

app.use('/api/tours', toursRoutes );
app.use('/api/users', userRoutes );
app.use('/api/review', reviewRoutes );
app.use('/api/auth', authRoutes );


app.all(/.*/,  (req, res, next) => {
    next(new AppError(`Cannot find ${req.originalUrl} on this server!`, 404));
});

// Global Error Middleware
app.use(globalErrorHandler);

export default app;
