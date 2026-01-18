import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import { initDb } from './src/db.js';
import authRoutes from './src/routes/auth.js';

const fastify = Fastify({ logger: true });
const port = process.env.PORT || 3001;

await fastify.register(helmet);
await fastify.register(cors, { origin: true, credentials: true });
await fastify.register(cookie);

fastify.get('/health', async () => ({ status: 'ok' }));

await fastify.register(authRoutes, { prefix: '/auth' });

const start = async () => {
  try {
    await initDb();
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`Fastify backend listening on http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
