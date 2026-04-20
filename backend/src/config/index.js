const { toBool, toInt, toFloat } = require("./env");

const config = {
  crawler: {
    enabled: toBool(process.env.CRAWLER_ENABLED, true),
    intervalMs: toInt(process.env.CRAWLER_INTERVAL_MS, 5 * 60 * 1000),
    concurrency: toInt(process.env.CRAWLER_CONCURRENCY, 3),
    jobTimeoutMs: toInt(process.env.CRAWLER_JOB_TIMEOUT_MS, 45 * 1000),
    navTimeoutMs: toInt(process.env.CRAWLER_NAV_TIMEOUT_MS, 30 * 1000),
    retries: toInt(process.env.CRAWLER_RETRIES, 3),
    runOnce: toBool(process.env.CRAWLER_RUN_ONCE, true),
    minMatchScore: toFloat(process.env.CRAWLER_MIN_MATCH_SCORE, 0.55),
    headless: toBool(process.env.CRAWLER_HEADLESS, true),
    productsCollection: process.env.CRAWLER_PRODUCTS_COLLECTION || "products",
    priceHistoryCollection: process.env.CRAWLER_PRICE_HISTORY_COLLECTION || "price_history",
    userAgent:
      process.env.CRAWLER_USER_AGENT ||
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",

    // Global sources (used when products don't have per-product sources).
    // Override via env:
    // CRAWLER_SOURCES_JSON='[{"site":"sim5173","searchUrl":"http://localhost:5173/search?q="},{"site":"sim3000","searchUrl":"http://localhost:3000/search?q="}]'
    sources: (() => {
      try {
        if (process.env.CRAWLER_SOURCES_JSON) return JSON.parse(process.env.CRAWLER_SOURCES_JSON);
      } catch {
        // ignore parse errors and fall back to defaults
      }
      return [
        { site: "sim5173", baseUrl: "http://localhost:5173", searchUrl: "http://localhost:5173/search?q=" },
        { site: "sim3000", baseUrl: "http://localhost:3000", searchUrl: "http://localhost:3000/products?search=" },
      ];
    })(),
  },
  log: {
    level: process.env.LOG_LEVEL || "info",
  },
  prediction: {
    windowSize: toInt(process.env.PRED_WINDOW_SIZE, 4),
    steps: toInt(process.env.PRED_STEPS, 3),
    epochs: toInt(process.env.PRED_EPOCHS, 60),
    movingAvgWindow: toInt(process.env.PRED_FALLBACK_MOVING_AVG_WINDOW, 3),
    cacheTtlSeconds: toInt(process.env.PRED_CACHE_TTL_SECONDS, 24 * 60 * 60),
  },
};

module.exports = { config };

