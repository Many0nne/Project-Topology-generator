const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function initDb() {
  return Promise.resolve();
}

module.exports = {
  prisma,
  initDb
};
