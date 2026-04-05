import authService from "../services/authService.js";
import catchAsync from "../utils/catchAsync.js";
import {AppError} from "../errors/AppError.js";
import userRepository from "../repositories/userRepository.js";
import {ConflictError} from "../errors/ConflictError.js";

class AuthController {
    baseCookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        path: '/'
    };

    refreshCookieOptions = {
        ...this.baseCookieOptions,
        maxAge: 24 * 60 * 60 * 1000
    };

    accessCookieOptions = {
        ...this.baseCookieOptions,
        maxAge: 1 * 60 * 60 * 1000
    };

    // catchAsync sayesinde try-catch'e veda ediyoruz
    register = catchAsync(async (req, res, next) => {

        const {newUser, accessToken, refreshToken} = await authService.registerUser(req.body);

        res.cookie('accessToken', accessToken, this.accessCookieOptions);
        res.cookie('refreshToken', refreshToken, this.refreshCookieOptions);

        res.status(201).json({
            status: "success",
            data: {
                user: newUser,
                accessToken: accessToken,
            }
        });
    });

    login = catchAsync(async (req, res, next) => {
        const {email, password} = req.body;

        const {user, accessToken, refreshToken} = await authService.loginUser(
            email, password, req.ip, req.headers['user-agent']
        );

        res.cookie('accessToken', accessToken, this.accessCookieOptions);
        res.cookie('refreshToken', refreshToken, this.refreshCookieOptions);
        res.status(200).json({
            status: "success",
            data: {
                user,
                accessToken
            }
        });
    });

    refresh = catchAsync(async (req, res, next) => {
        const {refreshToken: oldToken} = req.cookies;

        if (!oldToken) {
            return next(new AppError("Lütfen tekrar giriş yapın.", 401));
        }

        const tokens = await authService.refreshTokens(
            oldToken, req.ip, req.headers['user-agent']
        );

        res.cookie('accessToken', tokens.accessToken, this.accessCookieOptions);
        res.cookie('refreshToken', tokens.refreshToken, this.refreshCookieOptions);
        res.status(200).json({
            status: "success",
            accessToken: tokens.accessToken
        });
    });

    logout = catchAsync(async (req, res, next) => {
        const {refreshToken} = req.cookies;

        if (!refreshToken) {
            return res.status(204).json({
                status: "success",
                message: "Zaten çıkış yapılmış."
            });
        }

        await authService.logoutUser(refreshToken);

        res.clearCookie('accessToken', this.accessCookieOptions);
        res.clearCookie('refreshToken', this.refreshCookieOptions);

        res.status(200).json({
            status: "success",
            message: "Başarıyla çıkış yapıldı."
        });
    });

    /**
     * 1) Şifre Sıfırlama İsteği (Token Oluşturma ve Email Gönderme)
     */
    forgotPassword = catchAsync(async (req, res, next) => {
        // 1) Email'i istek gövdesinden al
        const {email} = req.body;

        if (!email) {
            return next(new AppError("Lütfen e-posta adresinizi girin.", 400));
        }

        const message = await authService.forgotPassword(email);

        res.status(200).json({
            status: "success",
            message: message
        });
    });

    /**
     * 2) Yeni Şifreyi Kaydetme (Token Doğrulama ve Şifre Güncelleme)
     */
    resetPassword = catchAsync(async (req, res, next) => {
        const {token} = req.params;
        const {password, passwordConfirm} = req.body;

        const result = await authService.resetPassword(token, password, passwordConfirm);

        res.cookie('accessToken', result.accessToken, this.accessCookieOptions);
        res.cookie('refreshToken', result.refreshToken, this.refreshCookieOptions);

        res.status(200).json({
            status: "success",
            message: "Şifreniz başarıyla güncellendi.",
            accessToken: result.accessToken
        });
    });
}

export default new AuthController();