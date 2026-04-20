const mongoose = require("mongoose");
const { config } = require("../config");

const sourceSchema = new mongoose.Schema(
  {
    site: { type: String, required: true },
    baseUrl: { type: String, default: "" },
    searchUrl: { type: String, required: true }, // e.g. http://localhost:5173/search?q=
  },
  { _id: false }
);

const crawlerProductSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    keywords: [{ type: String }],
    sources: [sourceSchema],
  },
  { timestamps: true }
);

// NOTE: Collection is configurable to avoid clashing with existing storefront "products".
module.exports = mongoose.model(
  "CrawlerProduct",
  crawlerProductSchema,
  config.crawler.productsCollection
);

