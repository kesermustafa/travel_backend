import {createHash} from "node:crypto";
import userRepository from "../repositories/userRepository.js";
import RefreshToken from "../model/RefreshToken.js";
import * as jwtHelper from "../security/jwtHelper.js";
import {ConflictError} from "../errors/ConflictError.js";
import {ValidationError} from "../errors/ValidationError.js";
import {AppError} from "../errors/AppError.js";
import Email from "../utils/email.js";
import ms from 'ms'

class AuthService {
    // Merkezi Cihaz Sınırı Kontrolü (Kod tekrarını önlemek için)
    async #handleDeviceLimit(userId) {
        const activeSessions = await RefreshToken.countDocuments({userId});
        if (activeSessions >= 3) {
            // En eski oturumu bul ve sil
            const oldestToken = await RefreshToken.findOne({userId}).sort({createdAt: 1});
            if (oldestToken) await oldestToken.deleteOne();
        }
    }

    // 1) Kayıt İşlemi
    async registerUser(userData) {

        // 1) E-posta kontrolü
        const userExists =
            await userRepository.model.findOne({ email: userData.email.toLowerCase().trim() }).getFilter();

        if (userExists) throw new ConflictError("Bu e-posta zaten kayıtlı.");

        // 2) Şifre eşleşme kontrolü (Mongoose validator'da da olabilir ama burada olması hızlı hata döndürür)
        if (userData.password !== userData.passwordConfirm) {
            throw new ValidationError("Şifreler birbiriyle eşleşmiyor.");
        }

        // 3) Kullanıcıyı oluştur
        // Not: Şemadaki pre('save') middleware'i burada şifreyi hash'leyecektir.
        const newUser = await userRepository.create({...userData, role: 'USER'});

        // 4) Tokenları üret (Şifreyi silmeden önce yapmak daha garantidir)
        const { accessToken, refreshToken } = await jwtHelper.generateTokens(newUser);

        // 5) Hassas verileri response objesinden temizle
        // .toObject() kullanarak Mongoose dökümanını sade bir JS objesine çeviriyoruz
        const userResponse = newUser.toObject();
        delete userResponse.password;
        delete userResponse.passwordConfirm;
        delete userResponse.__v;

        const refreshTokenExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '24h';

        // 6) Refresh Token'ı veritabanına kaydet
        await RefreshToken.create({
            userId: newUser._id,
            token: refreshToken,
            // .env içindeki refresh süresine paralel bir süre set etmek daha iyidir
            expiresAt: new Date(Date.now() + ms(refreshTokenExpiresIn)),
        });


        // 7) Arka planda Email gönderimi (Non-blocking)
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const welcomeUrl = `${frontendUrl}/api/users/me/update`;

        new Email(newUser, welcomeUrl).sendWelcome().catch(err => {
            console.error("📧 Hoş geldin maili gönderilemedi:", err.message);
        });

        // 8) Sonuç dön
        return {
            user: userResponse,
            accessToken,
            refreshToken
        };
    }

    async loginUser(email, password, ip, userAgent) {
        // 1) Kullanıcıyı şifre ve active durumuyla birlikte getir
        const user = await userRepository.model.findOne({ email }).select("+password +active +deletedAt");

        // 2) Kullanıcı var mı ve şifre doğru mu kontrol et
        if (!user || !(await user.correctPassword(password))) {
            throw new ValidationError("E-posta veya şifre hatalı.");
        }

        // 3) HESAP TEKRAR AKTİFLEŞTİRME (90 GÜNLÜK SİLME SAYACINI DURDURMA)
        if (user.active === false) {
            user.active = true;
            user.deletedAt = undefined; // TTL indeksini (otomatik silmeyi) iptal eder
            await user.save({ validateBeforeSave: false });
        }

        await this.#handleDeviceLimit(user._id);

        const { accessToken, refreshToken } = await jwtHelper.generateTokens(user);

        const refreshTokenExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '24h';

        await RefreshToken.create({
            userId: user._id,
            token: refreshToken,
            ip,
            userAgent,
            expiresAt: new Date(Date.now() + ms(refreshTokenExpiresIn)),
        });

        return { user, accessToken, refreshToken };
    }

    // 3) Refresh İşlemi
    async refreshTokens(oldToken, ip, userAgent) {
        const decoded = await jwtHelper.verifyToken(oldToken);
        if (!decoded) throw new AppError("Oturum süresi dolmuş veya geçersiz token.", 401);

        const storedToken = await RefreshToken.findOne({token: oldToken});

        // REUSE DETECTION
        if (!storedToken) {
            await RefreshToken.deleteMany({userId: decoded.id});
            throw new AppError("Güvenlik ihlali! Tüm oturumlar kapatıldı.", 403);
        }

        // Eski token'ı siliyoruz (Zaten 1 yer açılıyor)
        await storedToken.deleteOne();

        // AMA yine de garantiye alıyoruz: Başka bir cihaz o sırada login olmuş olabilir
        await this.#handleDeviceLimit(decoded.id);

        const user = await userRepository.findById(decoded.id);
        if (!user) throw new AppError("Kullanıcı artık mevcut değil.", 404);

        const tokens = await jwtHelper.generateTokens(user);

        const refreshTokenExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '24h';

        await RefreshToken.create({
            userId: user._id,
            token: tokens.refreshToken,
            ip,
            userAgent,
            expiresAt: new Date(Date.now() + ms(refreshTokenExpiresIn))
        });

        return tokens;
    }

    async logoutUser(token) {
        if (!token) return;
        await RefreshToken.deleteOne({token});
    }

    async forgotPassword(email) {
        // 1) Email'e göre kullanıcıyı bul
        const user = await userRepository.model.findOne({email});
        if (!user) {
            throw new AppError("Bu e-posta adresiyle kayıtlı bir kullanıcı bulunamadı.", 404);
        }

        // 2) Reset Token'ı üret (Modeldeki metodumuzu çağırıyoruz)
        const resetToken = user.createPasswordResetToken();

        // Değişiklikleri veritabanına kaydet (Validasyonları geçmesi için save kullanıyoruz)
        // passwordConfirm zorunluysa burada undefined yaparak bypass edebilirsin
        await user.save({validateBeforeSave: false});

        // 3) E-posta gönder
        try {
            const URL = `${process.env.FRONTEND_URL || 'http://localhost:3001'}`;

            const resetURL = `${URL}/api/auth/reset-password/${resetToken}`;

            await new Email(user, resetURL).sendPasswordReset();

            return "Şifre sıfırlama bağlantısı e-postanıza gönderildi.";
        } catch (err) {
            // Mail gönderimi başarısız olursa DB'deki tokenları temizle
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({validateBeforeSave: false});

            throw new AppError("E-posta gönderilirken bir hata oluştu. Lütfen sonra tekrar deneyin.", 500);
        }
    }

    async resetPassword(token, password, passwordConfirm) {
        // 1) Gelen token'ı hashle (Çünkü DB'de hashli saklıyoruz)
        const hashedToken = createHash('sha256')
            .update(token)
            .digest('hex');

        // 2) Token'ı ve süresini kontrol et
        const user = await userRepository.model.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: {$gt: Date.now()} // Süresi dolmamış olmalı
        });

        // 3) Kullanıcı yoksa veya süresi dolmuşsa hata ver
        if (!user) {
            throw new AppError('Token geçersiz veya süresi dolmuş.', 400);
        }

        // 4) Yeni şifreyi set et ve reset alanlarını temizle
        user.password = password;
        user.passwordConfirm = passwordConfirm;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;

        // Şifre değiştiği için pre-save middleware'i çalışacak ve passwordChangedAt güncellenecek
        await user.save();

        // 5) Kullanıcıya yeni bir Access Token üret (Şifre değişince otomatik giriş yapmış olur)
        const {accessToken, refreshToken} = await jwtHelper.generateTokens(user);

        const refreshTokenExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '24h';

        await RefreshToken.create({
            userId: user._id,
            token: refreshToken,
            expiresAt: new Date(Date.now() + ms(refreshTokenExpiresIn))
        });

        return {
            accessToken: accessToken,
            refreshToken: refreshToken,
        };
    }

}

export default new AuthService();