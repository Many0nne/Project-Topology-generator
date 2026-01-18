const path = require('path');

const base = path.resolve(__dirname, '..');

// Modules mapping: a module is a folder copied to project root.
module.exports = {
  'docker-dev': {
    frontend: path.join(base, 'modules', 'docker-dev', 'docker-dev-frontend'),
    fullstack: path.join(base, 'modules', 'docker-dev', 'docker-dev-fullstack'),
    fullstackAuth: path.join(base, 'modules', 'docker-dev', 'docker-dev-fullstack-auth'),
    fullstackAuthAdmin: path.join(base, 'modules', 'docker-dev', 'docker-dev-fullstack-auth-admin')
  }
};
