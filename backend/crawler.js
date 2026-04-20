require("dotenv").config();

const mongoose = require("mongoose");
const { crawlerWorker } = require("./src");
const { config } = require("./src/config");
const { logger } = require("./src/utils/logger");

const PORT = process.env.X_BEAT_CONDUCTOR_PORT || 6000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/bachat-bazaar";

async function main() {
  await mongoose.connect(MONGODB_URI);
  logger.info("mongo.connected", { service: "crawler", runOnce: config.crawler.runOnce });

  if (config.crawler.runOnce) {
    await crawlerWorker.start();
    await shutdown("RUN_ONCE_COMPLETE");
    return;
  }

  crawlerWorker.start().catch((err) => {
    logger.error("crawler.fatal", { err: err?.message, stack: err?.stack });
  });

  setInterval(() => {
    logger.info("crawler.heartbeat", { status: crawlerWorker.status(), port: PORT });
  }, 60_000).unref();
}

async function shutdown(signal) {
  try {
    logger.info("shutdown.signal", { service: "crawler", signal });
    await crawlerWorker.stop();
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

