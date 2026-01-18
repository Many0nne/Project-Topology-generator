const express = require('express');
const router = express.Router();
const { createUser, verifyUserCredentials, incrementTokenVersion, findUserById } = require('../services/userService');
const { signAccessToken, signRefreshToken, verifyRefreshToken, verifyAccessToken } = require('../utils/jwt');
const { prisma } = require('../db');
const { cookieSecure } = require('../config');

function setRefreshCookie(res, token) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: cookieSecure,
    sameSite: 'lax',
    path: '/auth/refresh'
  });
}

router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already in use' });
    const user = await createUser({ email, password });
    return res.json({ id: user.id, email: user.email });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await verifyUserCredentials(email, password);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    const refreshToken = signRefreshToken({ sub: user.id, tokenVersion: user.tokenVersion });
    setRefreshCookie(res, refreshToken);
    return res.json({ accessToken });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/refresh', async (req, res) => {
  const token = req.cookies && req.cookies.refreshToken;
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const payload = verifyRefreshToken(token);
    const user = await findUserById(payload.sub);
    if (!user) return res.status(401).json({ error: 'Invalid token' });
    if (payload.tokenVersion !== user.tokenVersion) return res.status(401).json({ error: 'Token revoked' });
    const newRefresh = signRefreshToken({ sub: user.id, tokenVersion: user.tokenVersion });
    setRefreshCookie(res, newRefresh);
    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    return res.json({ accessToken });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

router.post('/logout', async (req, res) => {
  const token = req.cookies && req.cookies.refreshToken;
  if (!token) return res.json({ ok: true });
  try {
    const payload = verifyRefreshToken(token);
    await incrementTokenVersion(payload.sub);
    res.clearCookie('refreshToken', { path: '/auth/refresh' });
    return res.json({ ok: true });
  } catch (err) {
    return res.json({ ok: true });
  }
});

router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = verifyAccessToken(token);
    const user = await findUserById(payload.sub);
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ id: user.id, email: user.email });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
