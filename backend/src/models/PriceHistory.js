const mongoose = require("mongoose");
const { config } = require("../config");

const priceHistorySchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, index: true },
    source: { type: String, required: true, index: true },
    price: { type: Number, required: true },
    scrapedAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

priceHistorySchema.index({ productId: 1, source: 1, scrapedAt: -1 });

module.exports = mongoose.model(
  "PriceHistory",
  priceHistorySchema,
  config.crawler.priceHistoryCollection
);

