const mongoose = require("mongoose");

const predictionItemSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const predictionSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, index: true },
    predictions: { type: [predictionItemSchema], default: [] },
    modelVersion: { type: String, default: "dense-v1" },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

// TTL: auto-expire documents after 1 min.
predictionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2 * 60 });
predictionSchema.index({ productId: 1, createdAt: -1 });

module.exports = mongoose.model("Prediction", predictionSchema, "predictions");

