import userRepository from "../repositories/userRepository.js";
import RefreshToken from "../model/RefreshToken.js";
import * as jwtHelper from "../security/jwtHelper.js";
import {AppError} from "../errors/AppError.js";
import {ValidationError} from "../errors/ValidationError.js";
import {NotFoundError} from "../errors/NotFoundError.js";
import {ConflictError} from "../errors/ConflictError.js";
import filterObj from "../utils/filterObj.js";
import {ROLES} from "../constants/roles.js";
import {deleteFile} from "../utils/fileImageDeleteHelper.js";


class UserService {

    getCurrentUserDetailed = async (userId, fields = "") => {
        const user = await userRepository.model.findById(userId).select(fields); // fields örneği: "+password +active"
        if (!user) throw new AppError("Kullanıcı bulunamadı", 404);
        return user;
    };


    async createUser(userData) {


        // 1) E-posta kontrolü
        const userExists = await userRepository.model.findOne({ email: userData.email });
        if (userExists) throw new ConflictError("Bu e-posta zaten kayıtlı.");

        // 2) Şifre eşleşme kontrolü (Mongoose validator'da da olabilir ama burada olması hızlı hata döndürür)
        if (userData.password !== userData.passwordConfirm) {
            throw new ValidationError("Şifreler birbiriyle eşleşmiyor.");
        }

        // 3) Kullanıcıyı oluştur
        // Not: Şemadaki pre('save') middleware'i burada şifreyi hash'leyecektir.
        const newUser = await userRepository.create({
            ...userData,
            active: true
        });

        const userResponse = newUser.toObject();
        delete userResponse.password;
        delete userResponse.passwordConfirm;
        delete userResponse.__v;

        return userResponse
    }

    async updateMe(userId, updateData, currentUser, ip, userAgent) {
        // GÜVENLİK: currentUser veya photo undefined ise çökmesini engelle (?. operatörü)
        if (updateData.photo && currentUser?.photo && currentUser.photo !== 'default.jpg') {
            deleteFile('users', currentUser.photo);
        }

        // Şifre güncelleme koruması
        if (updateData.password || updateData.passwordConfirm) {
            throw new AppError("Bu rota şifre güncelleme için değildir.", 400);
        }

        // Email değişim kontrolü
        const isEmailChanged = updateData.email && updateData.email !== currentUser?.email;
        if (isEmailChanged) {
            const emailExists = await userRepository.model.exists({ email: updateData.email });
            if (emailExists) throw new AppError("Bu email adresi zaten kullanımda.", 409);
        }

        // Sadece izin verilen alanları filtrele
        const filteredData = {};
        ['name', 'email', 'photo'].forEach(el => {
            if (updateData[el]) filteredData[el] = updateData[el];
        });

        // Güncelleme
        const updatedUser = await userRepository.model.findByIdAndUpdate(
            userId,
            filteredData,
            { returnDocument: 'after', runValidators: true }
        );

        if (!updatedUser) throw new AppError("Kullanıcı bulunamadı.", 404);

        // Token işlemleri (Email değiştiyse)
        let accessToken, refreshToken;
        if (isEmailChanged) {
            // jwtHelper ve RefreshToken modelini burada kullandığını varsayıyorum
            // const tokens = await jwtHelper.generateTokens(updatedUser);
            // ...
        }

        return {
            user: updatedUser,
            accessToken,
            isEmailChanged
        };
    }


    deleteMe = async (userId) => {
        const user = await userRepository.model.findByIdAndUpdate(userId,
            {active: false, deletedAt: new Date() }, { returnDocument: 'after' });

        if (!user) {
            throw new NotFoundError("Kullanici bulunamadi")
        }
        return user
    }

    updateUserByAdmin = async (userId, updateData) => {

        const user = await userRepository.model.findById(userId);
        if (!user) {
            throw new NotFoundError("Kullanıcı bulunamadı");
        }

        Object.keys(updateData).forEach((key) => {
            user[key] = updateData[key];
        });

        await user.save();
        return user;
    }


}


export default new UserService();



