import jwt from 'jsonwebtoken';
import { jwtAccessSecret, jwtRefreshSecret, accessTokenExpiresIn, refreshTokenExpiresIn } from '../config.js';

export function signAccessToken(payload) {
  return jwt.sign(payload, jwtAccessSecret, { expiresIn: accessTokenExpiresIn });
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, jwtRefreshSecret, { expiresIn: refreshTokenExpiresIn });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, jwtAccessSecret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, jwtRefreshSecret);
}
