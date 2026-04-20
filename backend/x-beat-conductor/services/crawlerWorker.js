const axios = require("axios");
const { config } = require("../config");
const { delay } = require("../utils/delay");
const { logger } = require("../utils/logger");
const { InMemoryQueue } = require("../queues/InMemoryQueue");
const { launchBrowser, newPage } = require("../crawler/browser");
const { scrapeProduct } = require("../crawler/scrapeProduct");
const PriceHistory = require("../models/PriceHistory");
const Product = require("../../models/Product");

function withTimeout(promise, ms, label = "timeout") {
  let t;
  const timeout = new Promise((_, reject) => {
    t = setTimeout(() => reject(new Error(label)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
}

async function checkSourceUp(searchUrl) {
  // Quick preflight: avoids spinning up puppeteer when the dev site is down.
  try {
    const base = new URL(searchUrl);
    base.search = "";
    base.hash = "";
    base.pathname = "/";
    await axios.get(base.toString(), { timeout: 5000, validateStatus: () => true });
    return true;
  } catch {
    return false;
  }
}

function monthLabel(d) {
  const date = d instanceof Date ? d : new Date(d);
  const fmt = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" });
  // "Apr 2026" (no comma)
  return fmt.format(date).replace(",", "");
}

async function updateEmbeddedMonthlyHistory({ productDoc, price, scrapedAt }) {
  const month = monthLabel(scrapedAt);

  if (!productDoc) return;

  const history = Array.isArray(productDoc.priceHistory) ? productDoc.priceHistory : [];
  const idx = history.findIndex((h) => h && h.month === month);
  if (idx >= 0) {
    history[idx].price = price;
    history[idx].date = scrapedAt;
  } else {
    history.push({ month, date: scrapedAt, price });
  }

  productDoc.priceHistory = history;
  // Keep main price aligned with latest scrape for that platform/product.
  productDoc.price = price;

  await productDoc.save();
}

function monthKeyToTime(monthKey) {
  // monthKey format: "Apr 2026"
  // Use a stable parse target.
  const d = new Date(`${monthKey} 01`);
  const t = d.getTime();
  return Number.isFinite(t) ? t : null;
}

function dateToTime(dateValue) {
  if (!dateValue) return null;
  const d = dateValue instanceof Date ? dateValue : new Date(dateValue);
  const t = d.getTime();
  return Number.isFinite(t) ? t : null;
}

async function appendEmbeddedHistory({ productDoc, priceHistory, price, scrapedAt }) {
  if (!productDoc) return;
  if (!Array.isArray(priceHistory) || !priceHistory.length) return;

  // Normalize incoming items.
  const incoming = priceHistory
    .map((h) => ({
      month: String(h?.month || "").trim(),
      date: h?.date ? new Date(h.date) : null,
      price: Math.round(Number(h?.price)),
    }))
    .filter((h) => h.month && Number.isFinite(h.price) && h.price > 0)
    .slice(-12); // don't process unbounded history payloads

  if (!incoming.length) return;

  const existing = Array.isArray(productDoc.priceHistory) ? productDoc.priceHistory : [];
  const byMonth = new Map();

  // Seed from existing.
  for (const h of existing) {
    const month = String(h?.month || "").trim();
    const date = h?.date ? new Date(h.date) : null;
    const p = Math.round(Number(h?.price));
    if (!month || !Number.isFinite(p) || p <= 0) continue;
    byMonth.set(month, { month, date, price: p });
  }

  // Merge incoming (overwrite same month, append new month).
  for (const h of incoming) {
    byMonth.set(h.month, { month: h.month, date: h.date, price: h.price });
  }

  // Sort chronologically when possible; otherwise stable by insertion.
  const merged = Array.from(byMonth.values()).sort((a, b) => {
    const ta = dateToTime(a.date) ?? monthKeyToTime(a.month);
    const tb = dateToTime(b.date) ?? monthKeyToTime(b.month);
    if (ta == null && tb == null) return 0;
    if (ta == null) return -1;
    if (tb == null) return 1;
    return ta - tb;
  });

  // Keep last 12 months.
  productDoc.priceHistory = merged.slice(-12);
  if (Number.isFinite(price) && price > 0) productDoc.price = price;
  // Keep updatedAt moving even if only history changes.
  if (scrapedAt) productDoc.updatedAt = scrapedAt;
  await productDoc.save();
}

class CrawlerWorker {
  constructor() {
    this.running = false;
    this.stopping = false;
    this.browser = null;
    this.queue = new InMemoryQueue({ concurrency: config.crawler.concurrency });
    this.lastRun = null;
    this.lastStats = { processed: 0, ok: 0, noMatch: 0, errors: 0 };
  }

  status() {
    return {
      enabled: config.crawler.enabled,
      running: this.running,
      stopping: this.stopping,
      intervalMs: config.crawler.intervalMs,
      concurrency: config.crawler.concurrency,
      lastRun: this.lastRun,
      queueSize: this.queue.size(),
      stats: this.lastStats,
      productsCollection: config.crawler.productsCollection,
      priceHistoryCollection: config.crawler.priceHistoryCollection,
    };
  }

  async start() {
    if (!config.crawler.enabled) {
      logger.info("crawler.disabled");
      return;
    }
    if (this.running) return;
    this.running = true;
    this.stopping = false;

    this.browser = await launchBrowser();
    logger.info("crawler.started", {
      intervalMs: config.crawler.intervalMs,
      concurrency: config.crawler.concurrency,
      productsCollection: config.crawler.productsCollection,
    });

    // Continuous loop (not cron-based)
    while (!this.stopping) {
      this.lastRun = new Date();
      this.lastStats = { processed: 0, ok: 0, noMatch: 0, errors: 0 };

      try {
        const products = await Product.find({}).select("name slug keywords platform priceHistory").lean();
        logger.info("crawler.fetched_products", { count: products.length, sources: config.crawler.sources?.length || 0 });

        for (const product of products) {
          this.queue.push(() =>
            this._processProductAllSources({ product }).catch((err) => {
              this.lastStats.errors++;
              logger.error("crawler.job_failed", {
                productId: String(product?._id || ""),
                err: err?.message,
                stack: err?.stack,
              });
            })
          );
        }

        await this.queue.onDrain();
        logger.info("crawler.cycle_complete", { stats: this.lastStats });
        if (config.crawler.runOnce) {
          logger.info("crawler.run_once_complete", { stats: this.lastStats });
          this.stopping = true;
          break;
        }
      } catch (err) {
        logger.error("crawler.cycle_error", { err: err?.message, stack: err?.stack });
      }

      if (this.stopping) break;
      await delay(config.crawler.intervalMs);
    }
  }

  async stop() {
    if (!this.running) return;
    this.stopping = true;
    this.queue.stop();
    try {
      await this.queue.onDrain();
    } catch {
      // ignore
    }
    if (this.browser) {
      try {
        await this.browser.close();
      } catch {
        // ignore
      }
    }
    this.browser = null;
    this.running = false;
    logger.info("crawler.stopped");
  }

  async _scrapeOneSourceWithRetries({ product, source }) {
    const productId = String(product._id || "");
    const site = source.site;

    if (!source.searchUrl) {
      return { status: "error", error: "missing_search_url" };
    }

    const up = await checkSourceUp(source.searchUrl);
    if (!up) {
      return { status: "error", error: "source_down" };
    }

    for (let attempt = 1; attempt <= config.crawler.retries; attempt++) {
      if (this.stopping) return { status: "error", error: "stopping" };
      let page = null;
      try {
        page = await newPage(this.browser);
        const result = await withTimeout(
          scrapeProduct({
            page,
            source,
            product: {
              productId,
              name: product.name,
              slug: product.slug,
              keywords: product.keywords || [],
            },
            minMatchScore: config.crawler.minMatchScore,
          }),
          config.crawler.jobTimeoutMs,
          "job_timeout"
        );
        return result;
      } catch (err) {
        const isLast = attempt === config.crawler.retries;
        logger.warn("crawler.retry", {
          productId,
          site,
          attempt,
          retries: config.crawler.retries,
          err: err?.message,
        });
        if (!isLast) await delay(500 * attempt);
        if (isLast) return { status: "error", error: err?.message || "unknown_error" };
      } finally {
        if (page) {
          try {
            await page.close();
          } catch {
            // ignore
          }
        }
      }
    }
    return { status: "error", error: "unknown_error" };
  }

  async _processProductAllSources({ product }) {
    this.lastStats.processed++;
    const productId = String(product._id || "");
    const sources = Array.isArray(config.crawler.sources) ? config.crawler.sources : [];
    if (!sources.length) {
      this.lastStats.errors++;
      logger.error("crawler.no_sources_configured");
      return;
    }

    // Per-source ingestion: ingest any successful scrape, even if other sources fail.
    const results = [];
    for (const source of sources) {
      const r = await this._scrapeOneSourceWithRetries({ product, source });
      results.push({ source, result: r });
      if (r.status !== "ok") {
        logger.warn("crawler.product_missing_on_source", {
          productId,
          name: product.name,
          site: source.site,
          status: r.status,
          error: r.error,
        });
      }
    }

    const okResults = results.filter((x) => x?.result?.status === "ok" && Number.isFinite(x?.result?.price));
    if (!okResults.length) {
      this.lastStats.noMatch++;
      return;
    }

    const scrapedAt = new Date();

    // Write history for any successful sources
    await PriceHistory.insertMany(
      okResults.map(({ source, result }) => ({
        productId,
        source: source.site,
        price: Math.round(result.price),
        scrapedAt,
      }))
    );

    // Update embedded monthly history only for the matching platform doc (if any).
    // If your Product docs are duplicated per platform, this keeps each doc aligned with its own site.
    const productDoc = await Product.findById(productId);
    if (productDoc) {
      const matching = okResults.find((x) => x.source.site === productDoc.platform);
      if (matching) {
        // Prefer full 12-month history if scraper captured it; otherwise just update the current month.
        if (Array.isArray(matching.result.priceHistory) && matching.result.priceHistory.length) {
          await appendEmbeddedHistory({
            productDoc,
            priceHistory: matching.result.priceHistory,
            price: Math.round(matching.result.price),
            scrapedAt,
          });
        } else {
          await updateEmbeddedMonthlyHistory({
            productDoc,
            price: Math.round(matching.result.price),
            scrapedAt,
          });
        }
      }
    }

    this.lastStats.ok++;
    logger.info("crawler.product_ingested_sources", {
      productId,
      name: product.name,
      sources: okResults.map((r) => ({ site: r.source.site, price: r.result.price })),
      missingSources: results
        .filter((x) => x?.result?.status !== "ok")
        .map((x) => ({ site: x.source.site, status: x.result.status, error: x.result.error })),
    });
  }
}

module.exports = { CrawlerWorker };

