const { config } = require("../config");
const { logger } = require("../utils/logger");

function loadTf() {
  // Prefer native bindings for production; fall back to pure JS if needed.
  // If neither is installed, caller can fall back to moving average.
  try {
    // eslint-disable-next-line global-require
    return require("@tensorflow/tfjs-node");
  } catch {
    // eslint-disable-next-line global-require
    return require("@tensorflow/tfjs");
  }
}

function toHistoryTime(value) {
  if (!value) return null;
  const asDate = new Date(value);
  const asDateTime = asDate.getTime();
  if (Number.isFinite(asDateTime)) return asDateTime;

  const monthParsed = new Date(`${String(value)} 01`);
  const monthTime = monthParsed.getTime();
  return Number.isFinite(monthTime) ? monthTime : null;
}

function sortHistoryAsc(history) {
  return [...history].sort((a, b) => {
    const ta = toHistoryTime(a.date);
    const tb = toHistoryTime(b.date);
    if (ta == null && tb == null) return String(a.date || "").localeCompare(String(b.date || ""));
    if (ta == null) return -1;
    if (tb == null) return 1;
    return ta - tb;
  });
}

function toPriceArray(sortedHistory) {
  return sortedHistory
    .map((h) => Number(h?.price))
    .filter((p) => Number.isFinite(p));
}

function minMaxScale(values) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { min: 0, max: 0, scaled: values.map(() => 0) };
  }
  if (max === min) {
    return { min, max, scaled: values.map(() => 0) };
  }
  const scaled = values.map((v) => (v - min) / (max - min));
  return { min, max, scaled };
}

function denormalize(v, min, max) {
  if (max === min) return min;
  return v * (max - min) + min;
}

function buildModel(windowSize) {
  const tf = loadTf();
  const model = tf.sequential();
  model.add(tf.layers.dense({ inputShape: [windowSize], units: 16, activation: "relu" }));
  model.add(tf.layers.dense({ units: 8, activation: "relu" }));
  model.add(tf.layers.dense({ units: 1 }));
  model.compile({ optimizer: tf.train.adam(0.01), loss: "meanSquaredError" });
  return model;
}

function makeSlidingWindowDataset(values, windowSize) {
  const xs = [];
  const ys = [];
  for (let i = 0; i + windowSize < values.length; i += 1) {
    xs.push(values.slice(i, i + windowSize));
    ys.push(values[i + windowSize]);
  }
  return { xs, ys };
}

function movingAverageForecast(prices, steps, window) {
  const seq = prices.slice();
  const preds = [];
  for (let i = 0; i < steps; i += 1) {
    const n = Math.max(1, Math.min(window, seq.length));
    const tail = seq.slice(seq.length - n);
    const avg = tail.reduce((s, v) => s + v, 0) / n;
    seq.push(avg);
    preds.push(avg);
  }
  return preds;
}

async function trainAndPredict({ history, windowSize, steps, epochs }) {
  const tf = loadTf();
  const sorted = sortHistoryAsc(history);
  const pricesRaw = toPriceArray(sorted);

  const minRecommended = 6;
  if (pricesRaw.length < windowSize + 1) {
    const fallback = movingAverageForecast(
      pricesRaw,
      steps,
      config.prediction.movingAvgWindow
    );
    return {
      mode: "fallback",
      prices: fallback,
      warning: `Insufficient history for windowSize=${windowSize}. Need at least ${
        windowSize + 1
      } points.`,
    };
  }

  const { min, max, scaled } = minMaxScale(pricesRaw);
  const { xs, ys } = makeSlidingWindowDataset(scaled, windowSize);

  if (xs.length < 1) {
    const fallback = movingAverageForecast(
      pricesRaw,
      steps,
      config.prediction.movingAvgWindow
    );
    return {
      mode: "fallback",
      prices: fallback,
      warning: "Not enough sequences after sliding-window transform.",
    };
  }

  const xsTensor = tf.tensor2d(xs, [xs.length, windowSize]);
  const ysTensor = tf.tensor2d(ys, [ys.length, 1]);

  const model = buildModel(windowSize);
  const started = Date.now();
  await model.fit(xsTensor, ysTensor, {
    epochs,
    batchSize: Math.min(16, xs.length),
    shuffle: true,
    verbose: 0,
  });
  const trainingMs = Date.now() - started;

  xsTensor.dispose();
  ysTensor.dispose();

  const seqScaled = scaled.slice(-windowSize);
  const preds = [];
  for (let i = 0; i < steps; i += 1) {
    const input = tf.tensor2d([seqScaled], [1, windowSize]);
    const out = model.predict(input);
    const outVal = (await out.data())[0];
    input.dispose();
    out.dispose();

    const predRaw = denormalize(outVal, min, max);
    const predScaled = max === min ? 0 : (predRaw - min) / (max - min);

    preds.push(predRaw);
    seqScaled.shift();
    seqScaled.push(predScaled);
  }

  model.dispose();

  const warning =
    pricesRaw.length < minRecommended
      ? `History length ${pricesRaw.length} is below recommended minimum of ${minRecommended}.`
      : null;

  logger.info("predict.trained", {
    windowSize,
    epochs,
    trainingMs,
    historyLen: pricesRaw.length,
    preds: preds.map((p) => Math.round(p * 100) / 100),
  });

  return { mode: "ml", prices: preds, trainingMs, warning };
}

module.exports = {
  sortHistoryAsc,
  toPriceArray,
  trainAndPredict,
  movingAverageForecast,
};

