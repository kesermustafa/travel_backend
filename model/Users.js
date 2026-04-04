import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import validator from "validator";
import {randomBytes, createHash} from "node:crypto";


const userSchema = new mongoose.Schema({
    name: {
        type: String, required: [true, "User must have a name"], trim: true,
    },

    email: {
        type: String, required: [true, "User must have an email"], unique: true, lowercase: true, trim: true,
        validate: [validator.isEmail, "email must be a valid email address  "],
    },

    role: {
        type: String, enum: ["USER", "GUIDE", "LEAD-GUIDE", "ADMIN"], default: "USER",
    },

    active: {
        type: Boolean, default: true, select: false,
    },

    photo: {
        type: String, default: "default.jpg",
    },

    password: {
        type: String,
        required: [true, "User must have a password"],
        minlength: 8,
        select: false
    },

    passwordConfirm: {
        type: String,
        required: [function() { return this.isNew || this.isModified('password'); }, 'Please confirm your password'],
        validate: {
            // Sadece şifre değiştirildiğinde çalışır
            validator: function(el) {
                return el === this.password;
            },
            message: 'Passwords are not the same!'
        }
    },

    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,

    deletedAt: {
        type: Date,
        default: null,
        select: false,
        index: { expires: '90d' } // KRİTİK: 90 gün sonra bu dokümanı DB'den siler
    },

}, {
    timestamps: true,
    toObject:{virtuals: true },
    toJSON: {
        transform: (doc, ret) => {
            delete ret.password;
            delete ret.passwordConfirm;
            delete ret.passwordChangedAt;
            delete ret.passwordResetToken;
            delete ret.passwordResetExpires;
            delete ret.__v;
            return ret;
        }
    }
});

// Şifre Hashleme
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;
    next();
});


userSchema.methods.correctPassword = async function (candidatePassword) {
    // 'this.password' select("+password") ile çekildiği sürece burada erişilebilir olur
    return await bcrypt.compare(candidatePassword, this.password);

};


// Şifre Değişim Tarihi Güncelleme
userSchema.pre("save", function (next) {
    if (!this.isModified("password") || this.isNew) return next();
    this.passwordChangedAt = Date.now() - 1000;
    next();
});


// Sorgu Filtreleme (Active Kontrolü)
userSchema.pre(/^find/, function () {
    const queryFilter = this.getQuery();
    const options = this.getOptions();

    // active filtresi varsa olduğu gibi bırak
    if (queryFilter.hasOwnProperty('active')) return;

    // includeInactive flag'i varsa (ADMIN) tüm kullanıcıları getir
    if (options.includeInactive) return;

    // Varsayılan: sadece aktif kullanıcılar
    this.where({ active: { $ne: false } });
});

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        );
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

userSchema.methods.createPasswordResetToken = function () {

    const resetToken = randomBytes(32).toString('hex');

    this.passwordResetToken = createHash('sha256')
        .update(resetToken)
        .digest('hex');

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    return resetToken;
};



export default mongoose.model("User", userSchema);