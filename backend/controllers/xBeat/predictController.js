const Prediction = require("../../models/Prediction");
const Product = require("../../models/Product");
const { config } = require("../../src/config");
const { logger } = require("../../src/utils/logger");
const {
  trainAndPredict,
  sortHistoryAsc,
  toPriceArray,
  movingAverageForecast,
} = require("../../src/services/pricePrediction");

function nowMinusSeconds(seconds) {
  return new Date(Date.now() - seconds * 1000);
}

function normalizeHistory(history) {
  return history
    .map((item) => ({
      date: item?.date || item?.month,
      price: item?.price,
    }))
    .filter((item) => item.date && Number.isFinite(Number(item.price)));
}

function normalizePriceHistory(history) {
  return normalizeHistory(history).map((item) => ({
    month: String(item.date),
    price: Math.round(Number(item.price) * 100) / 100,
  }));
}

async function predictForProductId(productId, options) {
  const { windowSize, epochs, steps, cacheSince } = options;
  const product = await Product.findById(productId).select("platform priceHistory").lean();
  if (!product) {
    return { productId, error: "Product not found" };
  }

  const normalizedHistory = normalizeHistory(product.priceHistory || []);
  if (!normalizedHistory.length) {
    return { productId, platform: product.platform, error: "Product priceHistory is missing or invalid" };
  }

  const responsePriceHistory = normalizePriceHistory(product.priceHistory || []);
  const cached = await Prediction.findOne({
    productId,
    createdAt: { $gte: cacheSince },
  })
    .sort({ createdAt: -1 })
    .lean();

  if (cached?.predictions?.length) {
    logger.info("predict.cache_hit", { productId, ageMs: Date.now() - new Date(cached.createdAt).getTime() });
    return {
      productId,
      platform: product.platform,
      priceHistory: responsePriceHistory,
      predictedPrice: cached.predictions[0],
    };
  }

  // Sort history asc by date/month, extract only price values for training.
  const sorted = sortHistoryAsc(normalizedHistory);

  let result;
  try {
    result = await trainAndPredict({
      history: sorted,
      windowSize,
      steps,
      epochs,
    });
  } catch (e) {
    logger.error("predict.ml_failed", { productId, err: e?.message, stack: e?.stack });
    // Fallback: handled inside trainAndPredict for short histories; here we return a safe moving-average.
    result = {
      mode: "fallback",
      prices: [],
      warning: "ML failed; no fallback produced.",
    };
  }

  if (!result?.prices?.length) {
    const prices = toPriceArray(sorted);
    result = {
      mode: "fallback",
      prices: movingAverageForecast(prices, steps, config.prediction.movingAvgWindow),
      warning: result?.warning || "Used moving-average fallback.",
    };
  }

  const prediction = {
    date: "next",
    price: Math.round(Number(result.prices[0]) * 100) / 100,
  };
  if (!Number.isFinite(prediction.price)) {
    return { productId, platform: product.platform, error: "Could not produce prediction" };
  }

  await Prediction.create({
    productId,
    predictions: [prediction],
    modelVersion: `dense-v1_ws${windowSize}`,
  });

  return {
    productId,
    platform: product.platform,
    priceHistory: responsePriceHistory,
    predictedPrice: prediction,
  };
}

/**
 * POST /predict
 * Body:
 * {
 *   "productId": "string" | ["string", ...]
 * }
 */
exports.predictPrice = async (req, res) => {
  const started = Date.now();
  try {
    const { productId } = req.body || {};
    const productIds = Array.isArray(productId) ? productId : [productId];
    const validProductIds = productIds.filter((id) => typeof id === "string" && id.trim());
    if (!validProductIds.length) {
      return res.status(400).json({
        success: false,
        message: "productId is required as a string or array of strings",
      });
    }

    const windowSize = Math.max(2, Math.min(24, Math.trunc(config.prediction.windowSize)));
    const epochs = Math.max(5, Math.min(500, Math.trunc(config.prediction.epochs)));
    const steps = 1;
    const cacheSince = nowMinusSeconds(config.prediction.cacheTtlSeconds);

    const options = { windowSize, epochs, steps, cacheSince };
    const results = await Promise.all(validProductIds.map((id) => predictForProductId(id, options)));

    logger.info("predict.computed", {
      requestedCount: validProductIds.length,
      successCount: results.filter((r) => !r.error).length,
      errorCount: results.filter((r) => r.error).length,
      windowSize,
      steps,
      epochs,
      totalMs: Date.now() - started,
    });

    return res.json({ predictions: results });
  } catch (err) {
    logger.error("predict.error", { err: err?.message, stack: err?.stack });
    return res.status(500).json({ success: false, message: err.message });
  }
};

