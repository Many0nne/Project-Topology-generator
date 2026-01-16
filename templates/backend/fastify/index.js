import Fastify from 'fastify';

const fastify = Fastify({ logger: false });
const port = process.env.PORT || 3002;

fastify.get('/health', async (request, reply) => {
  return { status: 'ok' };
});

const start = async () => {
  try {
    await fastify.listen({ port });
    console.log(`Fastify backend listening on http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
