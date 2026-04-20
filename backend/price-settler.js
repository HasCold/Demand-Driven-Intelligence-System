require("dotenv").config();

const mongoose = require("mongoose");
const { priceSettlerWorker } = require("./x-beat-price-settler");
const { config } = require("./x-beat-price-settler/config");
const { logger } = require("./x-beat-conductor/utils/logger");

const PORT = process.env.X_BEAT_PRICE_SETTLER_PORT || 6001;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/bachat-bazaar";

async function main() {
  await mongoose.connect(MONGODB_URI);
  logger.info("mongo.connected", { service: "price_settler" });

  priceSettlerWorker.start().catch((err) => {
    logger.error("price_settler.fatal", { err: err?.message, stack: err?.stack });
  });

  setInterval(() => {
    logger.info("price_settler.heartbeat", {
      status: priceSettlerWorker.status(),
      intervalMs: config.priceSettler.intervalMs,
      port: PORT,
    });
  }, 60_000).unref();
}

async function shutdown(signal) {
  try {
    logger.info("shutdown.signal", { service: "price_settler", signal });
    await priceSettlerWorker.stop();
    await mongoose.connection.close();
    process.exit(0);
  } catch (e) {
    logger.error("shutdown.error", { err: e?.message, stack: e?.stack });
    process.exit(1);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

main().catch((err) => {
  logger.error("startup.error", { err: err?.message, stack: err?.stack });
  process.exit(1);
});
