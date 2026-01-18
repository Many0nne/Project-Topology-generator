import { createUser, verifyUserCredentials, incrementTokenVersion, findUserById } from '../services/userService.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken, verifyAccessToken } from '../utils/jwt.js';
import { cookieSecure } from '../config.js';

function setRefreshCookie(reply, token) {
  reply.setCookie('refreshToken', token, {
    httpOnly: true,
    secure: cookieSecure,
    sameSite: 'lax',
    path: '/auth/refresh'
  });
}

export default async function authRoutes(fastify) {
  fastify.post('/register', async (request, reply) => {
    const { email, password } = request.body || {};
    try {
      const existingUser = await findUserByEmail(email);
      if (existingUser) return reply.code(400).send({ error: 'Email already in use' });
      const user = await createUser({ email, password });
      return reply.send({ id: user.id, email: user.email });
    } catch (err) {
      return reply.code(500).send({ error: 'Server error' });
    }
  });

  fastify.post('/login', async (request, reply) => {
    const { email, password } = request.body || {};
    try {
      const user = await verifyUserCredentials(email, password);
      if (!user) return reply.code(401).send({ error: 'Invalid credentials' });
      const accessToken = signAccessToken({ sub: user.id, email: user.email });
      const refreshToken = signRefreshToken({ sub: user.id, tokenVersion: user.tokenVersion });
      setRefreshCookie(reply, refreshToken);
      return reply.send({ accessToken });
    } catch (err) {
      return reply.code(500).send({ error: 'Server error' });
    }
  });

  fastify.post('/refresh', async (request, reply) => {
    const token = request.cookies && request.cookies.refreshToken;
    if (!token) return reply.code(401).send({ error: 'No token' });
    try {
      const payload = verifyRefreshToken(token);
      const user = await findUserById(payload.sub);
      if (!user) return reply.code(401).send({ error: 'Invalid token' });
      if (payload.tokenVersion !== user.tokenVersion) return reply.code(401).send({ error: 'Token revoked' });
      const newRefresh = signRefreshToken({ sub: user.id, tokenVersion: user.tokenVersion });
      setRefreshCookie(reply, newRefresh);
      const accessToken = signAccessToken({ sub: user.id, email: user.email });
      return reply.send({ accessToken });
    } catch (err) {
      return reply.code(401).send({ error: 'Invalid token' });
    }
  });

  fastify.post('/logout', async (request, reply) => {
    const token = request.cookies && request.cookies.refreshToken;
    if (!token) return reply.send({ ok: true });
    try {
      const payload = verifyRefreshToken(token);
      await incrementTokenVersion(payload.sub);
      reply.clearCookie('refreshToken', { path: '/auth/refresh' });
      return reply.send({ ok: true });
    } catch (err) {
      return reply.send({ ok: true });
    }
  });

  fastify.get('/me', async (request, reply) => {
    const authHeader = request.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return reply.code(401).send({ error: 'Unauthorized' });
    try {
      const payload = verifyAccessToken(token);
      const user = await findUserById(payload.sub);
      if (!user) return reply.code(404).send({ error: 'User not found' });
      return reply.send({ id: user.id, email: user.email });
    } catch (err) {
      return reply.code(401).send({ error: 'Invalid token' });
    }
  });
}
