import catchAsync from "../utils/catchAsync.js";
import { AppError } from "../errors/AppError.js";
import * as jwtHelper from "../security/jwtHelper.js";
import userRepository from "../repositories/userRepository.js";

/**
 * Kimlik Doğrulama Middleware
 */
export const requireAuth = catchAsync(async (req, res, next) => {

    const token =
        req.cookies?.accessToken ||
        (req.headers.authorization?.startsWith("Bearer") && req.headers.authorization.split(" ")[1]);

    if (!token) {
        return next(new AppError("Bu işlem için giriş yapmalısınız.", 401));
    }

    // 2) Token Doğrulama
    const decoded = await jwtHelper.verifyToken(token);
    if (!decoded) {
        return next(new AppError("Geçersiz veya süresi dolmuş token.", 401));
    }

    // 3) Kullanıcı hala var mı?
    const currentUser = await userRepository.model.findById(decoded.id).select("+active");
    if (!currentUser) {
        return next(new AppError("Bu token'a ait kullanıcı artık mevcut değil.", 401));
    }

    if (!currentUser.active) {
        return next(new AppError("Kullanici hesabi dodurlmus. Hesabinizi aktiflestirin?", 403));
    }

    // 4) Şifre Değişikliği Kontrolü
    // User modelinde 'changedPasswordAfter' metodun tanımlı olmalı
    if (currentUser.changedPasswordAfter && currentUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError("Şifreniz yakın zamanda değiştirildi. Lütfen tekrar giriş yapın.", 401));
    }

    // 5) Kullanıcıyı req objesine ekle
    req.user = currentUser;
    next();
});

/**
 * Yetki Sınırlandırma Middleware
 */
export const restrictTo = (...roles) => {
    return (req, res, next) => {
        // req.user requireAuth'dan geliyor
        if (!roles.includes(req.user.role)) {
            return next(new AppError("Bu işlemi yapmak için yetkiniz yok!", 403));
        }
        next();
    };
};