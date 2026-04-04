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
        validate: [validator.isEmail, "Please provide a valid email address"],
    },

    role: {
        type: String, enum: ["USER", "GUIDE", "LEAD-GUIDE", "ADMIN"], default: "USER", index: true
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
        required: [function() { return this.isNew || this.isModified('password'); }, 'Lütfen şifrenizi onaylayın'],
        validate: {
            validator: function(el) {
                return el === this.password;
            },
            message: 'Şifreler eşleşmiyor!'
        }
    },

    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,

    deletedAt: {
        type: Date,
        default: null,
        select: false,
        index: { expires: '90d' }
    },

}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: {
        transform: (doc, ret) => {
            delete ret.password;
            delete ret.passwordConfirm;
            delete ret.passwordChangedAt;
            delete ret.passwordResetToken;
            delete ret.passwordResetExpires;
            delete ret.deletedAt;
            delete ret.__v;
            return ret;
        }
    }
});

// Şifre Hashleme
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;
});

// Şifre Değişim Tarihi Güncelleme
userSchema.pre("save", function () {
    if (!this.isModified("password") || this.isNew) return;
    this.passwordChangedAt = Date.now() - 1000;
});

// Sorgu Filtreleme (Active Kontrolü)
userSchema.pre(/^find/, function () {
    const options = this.getOptions() || {};
    if (this.getQuery().active !== undefined) return;
    if (options.includeInactive) return;
    this.where({ active: true });
});

// Şifre Doğrulama
userSchema.methods.correctPassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// JWT Şifre Değişim Kontrolü
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

// Şifre Sıfırlama Token'ı
userSchema.methods.createPasswordResetToken = function () {
    const resetToken = randomBytes(32).toString('hex');

    this.passwordResetToken = createHash('sha256')
        .update(resetToken)
        .digest('hex');

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    return resetToken;
};

export default mongoose.model("User", userSchema);