const { prisma } = require('../db');
const { hashPassword, verifyPassword } = require('../utils/hash');

async function createUser({ email, password }) {
  const passwordHash = await hashPassword(password);
  return prisma.user.create({ data: { email, passwordHash } });
}

async function findUserByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

async function findUserById(id) {
  return prisma.user.findUnique({ where: { id } });
}

async function incrementTokenVersion(userId) {
  return prisma.user.update({ where: { id: userId }, data: { tokenVersion: { increment: 1 } } });
}

async function verifyUserCredentials(email, password) {
  const user = await findUserByEmail(email);
  if (!user) return null;
  const ok = await verifyPassword(user.passwordHash, password);
  if (!ok) return null;
  return user;
}

module.exports = { createUser, findUserByEmail, findUserById, verifyUserCredentials, incrementTokenVersion };
