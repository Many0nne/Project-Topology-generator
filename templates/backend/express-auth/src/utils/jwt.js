const jwt = require('jsonwebtoken');
const { jwtAccessSecret, jwtRefreshSecret, accessTokenExpiresIn, refreshTokenExpiresIn } = require('../config');

function signAccessToken(payload) {
  return jwt.sign(payload, jwtAccessSecret, { expiresIn: accessTokenExpiresIn });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, jwtRefreshSecret, { expiresIn: refreshTokenExpiresIn });
}

function verifyAccessToken(token) {
  return jwt.verify(token, jwtAccessSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, jwtRefreshSecret);
}

module.exports = { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken };
