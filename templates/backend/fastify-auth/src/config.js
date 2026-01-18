import dotenv from 'dotenv';
dotenv.config();

export const databaseUrl = process.env.DATABASE_URL;
export const jwtAccessSecret = process.env.JWT_ACCESS_SECRET;
export const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
export const accessTokenExpiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
export const refreshTokenExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
export const cookieSecure = process.env.COOKIE_SECURE === 'true';
