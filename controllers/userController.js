import userRepository from "../repositories/userRepository.js";
import * as jwtHelper from "../security/jwtHelper.js";
import catchAsync from "../utils/catchAsync.js";
import userService from "../services/userService.js";
import {AppError} from "../errors/AppError.js";
import ms from "ms";
import RefreshToken from "../model/RefreshToken.js";
import { ROLES } from '../constants/roles.js';
import {processSingleImage} from "../utils/imageHandler.js";

class UserController {

    refreshCookieOptions = {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        path: '/'
    };

    accessCookieOptions = {
        maxAge: 1 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        path: '/'
    };

    async createUser(req, res) {
        const user = await userService.createUser(req.body)
        res.status(201).json(
            {
                status: "success",
                message: "User created successfully",
                user: user
            }
        )
    }

    async getMyProfile(req, res) {
        const user = req.user;
        res.status(200).json({user});
    }


    getUserById = catchAsync(async (req, res, next) => {
        const id = req.params.id;
        const user = await userRepository.findById(id);
        res.status(200).json({
            user: user,
        });
    })

    getAllUsers = catchAsync(async (req, res, next) => {
        const filter = { ...req.query };
        const options = {};
        const isAdmin = req.user.role === ROLES.ADMIN;

        if (filter.hasOwnProperty('active')) {
            // active=false sorgusu sadece ADMIN'e açık
            if (filter.active === 'false' && !isAdmin) {
                return next(new AppError('Bu işlem için yetkiniz yok.', 403));
            }

            if (filter.active === 'false') filter.active = false;
            if (filter.active === 'true') filter.active = true;
        } else {
            // active filtresi yoksa:
            // ADMIN → tüm kullanıcılar, USER → sadece aktifler (middleware halleder)
            if (isAdmin) options.includeInactive = true;
        }

        const users = await userRepository.findAll(filter, options);

        res.status(200).json({
            results: users.length,
            data: { users },
        });
    });

    getUserByEmail = catchAsync(async (req, res, next) => {
        const {email} = req.params;
        if (!email) return res.status(400).json({message: "Email is required"});
        const user = await userRepository.findByEmail(email);
        res.status(200).json(user);
    })


    async updateUser(req, res) {
        const {id} = req.params;
        const updatedUser = await userService.updateUserByAdmin(id, req.body);
        res.status(200).json({
            status: "success",
            message: "Kullanıcı başarıyla güncellendi",
            data: {user: updatedUser}
        });
    }

    async deleteUser(req, res) {
        const id = req.params.id;
        await userRepository.delete(id);
        return res.status(200).json({
            message: "User deleted with successfully", id: id
        });
    }

    /**
     * Kullanıcı Şifre Güncelleme (Profil İçinden)
     */
    updatePassword = catchAsync(async (req, res, next) => {
        // 1) Kullanıcıyı şifresiyle birlikte getir (select: false olduğu için +password şart)
        const user = await userRepository.model.findById(req.user.id).select("+password");

        // 2) Body'den gelen verileri al
        const {currentPassword, password, passwordConfirm} = req.body;

        if (!currentPassword || !password || !passwordConfirm) {
            return next(new AppError("Lütfen mevcut şifrenizi ve yeni şifrenizi girin.", 400));
        }

        // 3) Mevcut şifrenin doğruluğunu kontrol et
        if (!(await user.correctPassword(currentPassword))) {
            return next(new AppError("Mevcut şifreniz yanlış.", 401));
        }

        // 4) Yeni şifreyi ata
        // NOT: Modeldeki pre('save') hook'u sayesinde şifre otomatik hash'lenecek
        // ve passwordChangedAt güncellenecektir.
        user.password = password;
        user.passwordConfirm = passwordConfirm;

        // 5) Kaydet (Validasyonlar burada çalışır: passwordConfirm kontrolü vb.)
        await user.save();

        // 6) GÜVENLİK: Şifre değiştiği için diğer tüm cihazlardaki oturumları kapat (Opsiyonel)
        // Eğer kullanıcının tüm cihazlardan çıkmasını istiyoruz
        await RefreshToken.deleteMany({userId: user._id});

        // 7) Yeni bir Token seti oluştur (Yeni şifre bilgisiyle uyumlu)
        const {accessToken, refreshToken} = await jwtHelper.generateTokens(user);

        // 8) Refresh Token'ı veritabanına kaydet (Cihaz sınırı kontrolü serviste yapılıyor ama burada manuel ekliyoruz)
        const refreshTokenExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '24h';
        await RefreshToken.create({
            userId: user._id,
            token: refreshToken,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            expiresAt: new Date(Date.now() + ms(refreshTokenExpiresIn))
        });

        // 9) Tarayıcıdaki Cookie'leri güncelle (this. kullanımı kritik!)
        res.cookie('accessToken', accessToken, this.accessCookieOptions);
        res.cookie('refreshToken', refreshToken, this.refreshCookieOptions);

        // 10) Hassas veriyi temizle
        user.password = undefined;

        res.status(200).json({
            status: "success",
            message: "Şifreniz başarıyla güncellendi. Tüm oturumlarınız yenilendi.",
            accessToken
        });
    });

    updateMe = catchAsync(async (req, res, next) => {

        if (req.file) {
            // Profil: 400x400 Tam Kare (Center Crop)
            req.body.photo = await processSingleImage(
                req.file.buffer,
                'users',
                [400, 400]
            );
        }

        const result = await userService.updateMe(
            req.user.id,     // userId
            req.body,        // updateData
            req.user,        // currentUser (Mongoose dökümanı veya objesi)
            req.ip,
            req.headers['user-agent']
        );

        if (result.isEmailChanged) {
            res.cookie('accessToken', result.accessToken, this.accessCookieOptions);
            res.cookie('refreshToken', result.refreshToken, this.refreshCookieOptions);
        }

        res.status(200).json({
            status: "success",
            data: {
                user: result.user,
                accessToken: result.accessToken
            }
        });
    });


    deleteMe = catchAsync(async (req, res, next) => {
        const user = await userService.deleteMe(req.user.id)
        res.status(200).json({
            status: "success",
            message: "Hesabiniz silindi",
            user: req.user.id,
        })
    })


}

export default new UserController;