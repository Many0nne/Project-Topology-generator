const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const cors = require('cors');
const { initDb } = require('./src/db');
const authRoutes = require('./src/routes/auth');

const app = express();
const port = process.env.PORT || 3001;

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/auth', authRoutes);

const start = async () => {
  try {
    await initDb();
    app.listen(port, () => {
      console.log(`Express backend listening on http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Failed to start app', err);
    process.exit(1);
  }
};

start();
