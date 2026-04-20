const { toInt, toBool } = require("./env");

const config = {
  priceSettler: {
    enabled: toBool(process.env.PRICE_SETTLER_ENABLED, true),
    intervalMs: toInt(process.env.PRICE_SETTLER_INTERVAL_MS, 60 * 1000),
    batchSize: toInt(process.env.PRICE_SETTLER_BATCH_SIZE, 100),
    maxRetryAttempts: toInt(process.env.PRICE_SETTLER_MAX_RETRY_ATTEMPTS, 3),
  },
};

module.exports = { config };
