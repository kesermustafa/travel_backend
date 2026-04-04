import {SignJWT, jwtVerify} from "jose";
import {AppError} from "../errors/AppError.js";

const getSecret = () => {
    const secretKey = process.env.JWT_SECRET;
    if (!secretKey || secretKey.length === 0) {
        throw new Error("JWT_SECRET is not defined in .env file!");
    }
    return new TextEncoder().encode(secretKey);
};

export const generateTokens = async (user) => {
    const secret = getSecret();
    const jti = crypto.randomUUID();

    const payload = {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
    };

    // Access Token
    const accessToken = await new SignJWT(payload)
        .setProtectedHeader({
            alg: "HS256",
            typ: "JWT"})
        .setIssuedAt()
        .setExpirationTime("1h")
        .sign(secret);

    // Refresh Token
    const refreshToken = await new SignJWT({id: user._id.toString(), jti})
        .setProtectedHeader({
            alg: "HS256",
            typ: "JWT"})
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(secret);

    return {accessToken, refreshToken};
};

export const verifyToken = async (token) => {
    try {
        const secret = getSecret();
        const { payload } = await jwtVerify(token, secret);
        return payload;
    } catch (error) {

        if (error.code === 'ERR_JWT_EXPIRED') {
            throw new AppError("Oturum süreniz doldu. Lütfen tekrar giriş yapın.", 401);
        }

        throw new AppError("Geçersiz token. Lütfen tekrar giriş yapın.", 401);
    }
};