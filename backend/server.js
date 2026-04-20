const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const { V1_PATH } = require('./shared/constants');
const mainRoutes = require("./routes/index");
const { logger } = require("./x-beat-conductor/utils/logger");

const app = express();

if (process.env.TRUST_PROXY === 'true' || process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Bachat Bazaar Routes
app.use(V1_PATH, mainRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Bachat Bazaar API is running 🛒' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Connect to MongoDB
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bachat-bazaar';

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    logger.info("mongo.connected");

    const server = app.listen(PORT, () => {
      logger.info("server.listening", { url: `http://localhost:${PORT}` });
    });

    const shutdown = async (signal) => {
      try {
        logger.info("shutdown.signal", { signal });
        await mongoose.connection.close();
        server.close(() => {
          logger.info("server.closed");
          process.exit(0);
        });
        // Force-exit safety net
        setTimeout(() => process.exit(0), 5000).unref();
      } catch (e) {
        logger.error("shutdown.error", { err: e?.message, stack: e?.stack });
        process.exit(1);
      }
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });
