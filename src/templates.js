const path = require('path');

const base = path.resolve(__dirname, '..');

// Explicit mapping: option -> frontend-choice -> list of { src, dest }
// - src: absolute path to template folder
// - dest: relative folder name to create inside the project ('' means project root)
module.exports = {
  frontend: {
    'react-vite': [
      {
        src: path.join(base, 'templates', 'frontend', 'react-vite', 'frontend-legacy'),
        dest: ''
      }
    ]
  },
  fullstack: {
    'react-vite+express': [
      {
        src: path.join(base, 'templates', 'frontend', 'react-vite', 'frontend-legacy'),
        dest: 'frontend'
      },
      {
        src: path.join(base, 'templates', 'backend', 'express'),
        dest: 'backend'
      }
    ],
    'react-vite+fastify': [
      {
        src: path.join(base, 'templates', 'frontend', 'react-vite', 'frontend-legacy'),
        dest: 'frontend'
      },
      {
        src: path.join(base, 'templates', 'backend', 'fastify'),
        dest: 'backend'
      }
    ]
  }
};
