const argon2 = require('argon2');

async function hashPassword(password) {
  return argon2.hash(password);
}

async function verifyPassword(hash, password) {
  return argon2.verify(hash, password);
}

module.exports = { hashPassword, verifyPassword };
