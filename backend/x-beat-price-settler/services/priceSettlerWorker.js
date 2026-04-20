const { config } = require("../config");
const { delay } = require("../../x-beat-conductor/utils/delay");
const { logger } = require("../../x-beat-conductor/utils/logger");
const PriceHistory = require("../../x-beat-conductor/models/PriceHistory");
const Product = require("../../models/Product");

function monthLabel(dateInput) {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const fmt = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" });
  return fmt.format(date).replace(",", "");
}

async function appendMonthlyPriceToProduct({ productId, price, eventDate }) {
  const product = await Product.findById(productId);
  if (!product) throw new Error("product_not_found");

  const month = monthLabel(eventDate);
  const history = Array.isArray(product.priceHistory) ? product.priceHistory : [];
  const idx = history.findIndex((item) => item && item.month === month);

  if (idx >= 0) {
    history[idx].price = price;
    history[idx].date = eventDate;
  } else {
    history.push({ month, date: eventDate, price });
  }

  product.priceHistory = history.slice(-12);
  product.price = price;
  await product.save();
}

class PriceSettlerWorker {
  constructor() {
    this.running = false;
    this.stopping = false;
    this.lastRun = null;
    this.lastStats = {
      batches: 0,
      scanned: 0,
      processed: 0,
      failed: 0,
      exhausted: 0,
    };
  }

  status() {
    return {
      enabled: config.priceSettler.enabled,
      running: this.running,
      stopping: this.stopping,
      intervalMs: config.priceSettler.intervalMs,
      batchSize: config.priceSettler.batchSize,
      maxRetryAttempts: config.priceSettler.maxRetryAttempts,
      lastRun: this.lastRun,
      stats: this.lastStats,
    };
  }

  async runCycle() {
    if (!config.priceSettler.enabled) return this.lastStats;

    const cycleStats = {
      batches: 0,
      scanned: 0,
      processed: 0,
      failed: 0,
      exhausted: 0,
    };

    this.lastRun = new Date();

    while (!this.stopping) {
      const docs = await PriceHistory.find({
        is_process: false,
        retry_attempts: { $lt: config.priceSettler.maxRetryAttempts },
      })
        .sort({ createdAt: 1 })
        .limit(config.priceSettler.batchSize)
        .select("_id productId price scrapedAt createdAt retry_attempts")
        .lean();

      if (!docs.length) break;

      cycleStats.batches++;
      cycleStats.scanned += docs.length;
      const writeOps = [];

      for (const doc of docs) {
        const eventDate = doc.createdAt || doc.scrapedAt || new Date();
        const numericPrice = Math.round(Number(doc.price));

        if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
          cycleStats.failed++;
          writeOps.push({
            updateOne: {
              filter: { _id: doc._id },
              update: { $inc: { retry_attempts: 1 } },
            },
          });
          continue;
        }

        try {
          await appendMonthlyPriceToProduct({
            productId: doc.productId,
            price: numericPrice,
            eventDate,
          });

          cycleStats.processed++;
          writeOps.push({
            updateOne: {
              filter: { _id: doc._id },
              update: { $set: { is_process: true } },
            },
          });
        } catch (err) {
          cycleStats.failed++;
          writeOps.push({
            updateOne: {
              filter: { _id: doc._id },
              update: { $inc: { retry_attempts: 1 } },
            },
          });

          logger.warn("price_settler.doc_failed", {
            priceHistoryId: String(doc._id),
            productId: doc.productId,
            retry_attempts: doc.retry_attempts,
            err: err?.message,
          });
        }
      }

      if (writeOps.length) {
        await PriceHistory.bulkWrite(writeOps, { ordered: false });
      }

      const exhaustedIds = docs
        .filter((doc) => doc.retry_attempts + 1 >= config.priceSettler.maxRetryAttempts)
        .map((doc) => doc._id);
      cycleStats.exhausted += exhaustedIds.length;
    }

    this.lastStats = cycleStats;
    logger.info("price_settler.cycle_complete", cycleStats);
    return cycleStats;
  }

  async start() {
    if (!config.priceSettler.enabled || this.running) return;

    this.running = true;
    this.stopping = false;

    logger.info("price_settler.started", {
      intervalMs: config.priceSettler.intervalMs,
      batchSize: config.priceSettler.batchSize,
      maxRetryAttempts: config.priceSettler.maxRetryAttempts,
    });

    while (!this.stopping) {
      try {
        await this.runCycle();
      } catch (err) {
        logger.error("price_settler.cycle_error", {
          err: err?.message,
          stack: err?.stack,
        });
      }

      if (this.stopping) break;
      await delay(config.priceSettler.intervalMs);
    }
  }

  async stop() {
    if (!this.running) return;
    this.stopping = true;
    this.running = false;
    logger.info("price_settler.stopped");
  }
}

module.exports = { PriceSettlerWorker };
