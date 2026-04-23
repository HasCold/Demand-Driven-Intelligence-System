const axios = require("axios");
const { scoreTitleMatch, normalizeText } = require("../utils/stringMatch");
const { parsePriceToNumber } = require("../utils/price");
const { delay } = require("../utils/delay");
const { logger } = require("../utils/logger");

function encodeQuery(q) {
  return encodeURIComponent(String(q ?? "").trim());
}

function slugifyProductName(name) {
  return String(name ?? "")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function directProductUrl(source, productName) {
  const base = String(source?.baseUrl || "").replace(/\/+$/g, "");
  if (!base) return null;
  const slug = slugifyProductName(productName);
  if (!slug) return null;
  return `${base}/product/${slug}`;
}

function directProductUrlFromSlug(source, slug) {
  const base = String(source?.baseUrl || "").replace(/\/+$/g, "");
  const s = String(slug || "").trim().replace(/^\/+|\/+$/g, "");
  if (!base || !s) return null;
  return `${base}/product/${s}`;
}

function normalizeScrapedPrice(price) {
  if (!Number.isFinite(price)) return null;
  // Prices should be PKR amounts; reject tiny fractional values (often % values like 0.119).
  if (price > 0 && price < 1) return null;
  const rounded = Math.round(price);
  return Number.isFinite(rounded) && rounded > 0 ? rounded : null;
}

function sanitizePriceHistory(history) {
  if (!Array.isArray(history)) return null;
  const cleaned = history
    .map((h) => ({
      month: String(h?.month || "").trim(),
      price: normalizeScrapedPrice(Number(h?.price)),
    }))
    .filter((h) => h.month && Number.isFinite(h.price));
  return cleaned.length ? cleaned.slice(-12) : null;
}

async function scrapeSearchResults(page) {
  // Generic result harvesting: try to pick anchors that look like product cards,
  // and avoid header/footer/nav links that often dominate the page.
  return await page.evaluate(() => {
    const isInTag = (el, tag) => {
      let cur = el;
      const t = String(tag || "").toUpperCase();
      while (cur) {
        if (cur.tagName === t) return true;
        cur = cur.parentElement;
      }
      return false;
    };

    const textOf = (el) => (el ? (el.textContent || "").replace(/\s+/g, " ").trim() : "");
    const safeHref = (a) => {
      try {
        return a && a.href ? String(a.href) : "";
      } catch {
        return "";
      }
    };

    const titleOfAnchor = (a) => {
      if (!a) return "";
      const aria = (a.getAttribute("aria-label") || "").trim();
      if (aria) return aria;
      const titleAttr = (a.getAttribute("title") || "").trim();
      if (titleAttr) return titleAttr;
      const imgAlt = (a.querySelector("img")?.getAttribute("alt") || "").trim();
      if (imgAlt) return imgAlt;
      return textOf(a);
    };

    const anchors = Array.from(document.querySelectorAll("a"))
      .filter((a) => a && safeHref(a))
      // Ignore obvious non-results
      .filter((a) => {
        const href = safeHref(a);
        if (!href) return false;
        if (href.startsWith("javascript:")) return false;
        if (href.includes("#")) return false;
        // ignore links that just loop back to search/home
        const u = new URL(href);
        if (u.pathname === "/" && !u.search) return false;
        if (u.pathname.includes("/search")) return false;
        // Skip header/footer/nav links (common source of false candidates)
        if (isInTag(a, "header") || isInTag(a, "nav") || isInTag(a, "footer")) return false;
        return true;
      })
      .slice(0, 400);

    const results = anchors.map((a) => {
      const title = titleOfAnchor(a);
      // Try to find a nearby "card-like" container so we don't score against the entire page.
      const container =
        a.closest('[data-testid*="product" i], [class*="product" i], article, li, section, div') ||
        a.parentElement;
      const containerText = container ? textOf(container) : "";
      return {
        href: safeHref(a),
        title,
        contextText: containerText,
      };
    });

    // De-dupe by href
    const seen = new Set();
    const deduped = [];
    for (const r of results) {
      if (seen.has(r.href)) continue;
      seen.add(r.href);
      deduped.push(r);
    }

    // Prefer likely product URLs (helps avoid marketing/blog links)
    const looksLikeProduct = (href) =>
      typeof href === "string" &&
      (href.includes("/product") ||
        href.includes("/products/") ||
        href.includes("productId=") ||
        href.includes("sku="));

    const productish = deduped.filter((r) => looksLikeProduct(r.href));
    return (productish.length ? productish : deduped).slice(0, 200);
  });
}

async function scrapeProductFromSearch({ page, source, product }) {
  const query = product.name;
  const encoded = encodeQuery(query);
  const base = String(source?.baseUrl || "").replace(/\/+$/g, "");
  const candidates = [];
  const addCandidate = (u) => {
    const s = String(u || "").trim();
    if (!s || candidates.includes(s)) return;
    candidates.push(s);
  };
  addCandidate(`${source.searchUrl}${encoded}`);
  // Shophub-style product listing search.
  if (base) addCandidate(`${base}/products?search=${encoded}`);
  // Bachat Bazaar-style direct search route.
  if (base) addCandidate(`${base}/search?q=${encoded}`);

  for (const url of candidates) {
    // For SPAs, "domcontentloaded" can be too early (results not rendered yet).
    await page.goto(url, { waitUntil: "networkidle2" });

    // Give SPAs a moment to populate.
    await delay(800);

    const searchResults = await scrapeSearchResults(page);
    if (!searchResults.length) {
      logger.warn("crawler.no_search_results", { site: source.site, url, productId: product.productId });
      continue;
    }

    const scored = searchResults
      .map((c) => {
        const score = scoreTitleMatch({
          candidateTitle: c.title || c.contextText,
          productName: product.name,
          keywords: product.keywords || [],
        });
        return { ...c, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    const best = scored[0];
    if (best) return best;
  }

  return null;
}

async function extractTitleAndPrice(page) {
  const data = await page.evaluate(() => {
    const textOf = (el) => (el ? (el.textContent || "").trim() : "");

    // Title heuristics
    const titleEl =
      document.querySelector('[data-testid*="title" i]') ||
      document.querySelector("h1") ||
      document.querySelector("h2");
    const title = textOf(titleEl);

    // Price heuristics
    // Avoid using whole-page text because charts/ticks/tooltips can introduce many numbers.
    const preferred =
      document.querySelector('[data-testid*="price" i]') ||
      document.querySelector('[class*="price" i]') ||
      document.querySelector('[id*="price" i]');

    const looksLikePrice = (s) => /rs\.?\s*[\d,]+/i.test(String(s || ""));

    const bestFromRsCandidates = () => {
      const candidates = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
      let node = walker.currentNode;
      while (node) {
        // Skip svg/canvas regions (charts)
        if (node.tagName === "SVG" || node.tagName === "CANVAS") {
          node = walker.nextNode();
          continue;
        }
        const t = (node.textContent || "").replace(/\s+/g, " ").trim();
        if (t && t.length <= 40 && looksLikePrice(t)) {
          const style = window.getComputedStyle(node);
          const fontSize = parseFloat(style.fontSize || "0") || 0;
          const fontWeight = parseFloat(style.fontWeight || "0") || 0;
          candidates.push({ t, fontSize, fontWeight });
        }
        node = walker.nextNode();
      }
      if (!candidates.length) return "";
      candidates.sort((a, b) => (b.fontSize - a.fontSize) || (b.fontWeight - a.fontWeight));
      return candidates[0].t;
    };

    let priceText = "";
    const preferredText = textOf(preferred);
    if (looksLikePrice(preferredText)) {
      priceText = preferredText;
    } else {
      priceText = bestFromRsCandidates();
    }

    return { title, priceText };
  });

  const price = parsePriceToNumber(data.priceText);
  const title = data.title;
  return { title, price };
}

async function scrapeFinalProductPage({ page, candidate }) {
  await page.goto(candidate.href, { waitUntil: "domcontentloaded" });
  await delay(700);
  const { title, price } = await extractTitleAndPrice(page);
  return { title, price: normalizeScrapedPrice(price) };
}

async function scrapeProductDirect({ page, source, product, minMatchScore }) {
  const href =
    directProductUrlFromSlug(source, product?.slug) || directProductUrl(source, product.name);
  if (!href) return null;

  // Try to capture the product JSON response (often includes priceHistory) that powers the UI/chart.
  let capturedProduct = null;
  let capturedPrice = null;
  let capturedTitle = null;
  let capturedHistory = null;
  const onResponse = async (resp) => {
    try {
      const url = resp.url();
      const isProductApi =
        url.includes("/bachat-bazaar/products/") ||
        url.includes("/shophub/products/") ||
        /\/api\/v\d+\/[^/]+\/products\/[^/?#]+/i.test(url);
      if (!isProductApi) return;
      // Only parse JSON responses.
      const headers = resp.headers ? resp.headers() : {};
      const ct = String(headers["content-type"] || headers["Content-Type"] || "");
      if (!ct.includes("application/json")) return;
      const txt = await resp.text();
      const json = JSON.parse(txt);
      const productData = json?.data?.data || json?.data || json;
      if (productData && typeof productData === "object") capturedProduct = productData;

      const history =
        productData?.priceHistory || json?.data?.data?.priceHistory || json?.data?.priceHistory || json?.priceHistory;
      const cleaned = sanitizePriceHistory(history);
      if (cleaned) capturedHistory = cleaned;

      const apiPrice = normalizeScrapedPrice(Number(productData?.price));
      if (apiPrice) capturedPrice = apiPrice;

      const apiTitle = String(productData?.name || productData?.title || "").trim();
      if (apiTitle) capturedTitle = apiTitle;
    } catch {
      // ignore
    }
  };
  page.on("response", onResponse);
  try {
    await page.goto(href, { waitUntil: "networkidle2" });
    await delay(800);

    const details = await extractTitleAndPrice(page);
    const candidateTitle = capturedTitle || details?.title || "";
    const score = scoreTitleMatch({
      candidateTitle,
      productName: product.name,
      keywords: product.keywords || [],
    });

    if (!Number.isFinite(score) || score < minMatchScore) {
      logger.warn("crawler.low_match_score", {
        site: source.site,
        productId: product.productId,
        bestTitle: normalizeText(candidateTitle),
        score,
        minMatchScore,
      });
      return null;
    }

    // Prefer API price (most reliable), fall back to DOM scrape.
    const price = capturedPrice || normalizeScrapedPrice(details?.price);
    if (!price) {
      logger.warn("crawler.missing_price", {
        site: source.site,
        productId: product.productId,
        href,
        title: candidateTitle || "",
      });
      return { status: "no_price" };
    }

    return {
      status: "ok",
      price,
      title: candidateTitle || product.name,
      href,
      matchScore: score,
      priceHistory: capturedHistory || undefined,
      _capturedFromApi: Boolean(capturedProduct),
    };
  } finally {
    page.off("response", onResponse);
  }
}

async function scrapeProductViaApi({ source, product, minMatchScore }) {
  const apiBase = String(source?.apiBaseUrl || "").replace(/\/+$/g, "");
  const slug = String(product?.slug || "").trim();
  if (!apiBase || !slug) return null;

  try {
    const resp = await axios.get(`${apiBase}/products/${encodeURIComponent(slug)}`, {
      timeout: 10_000,
      validateStatus: () => true,
    });
    if (resp.status < 200 || resp.status >= 300) return null;

    const payload = resp?.data?.data || resp?.data;
    if (!payload || typeof payload !== "object") return null;

    const candidateTitle = String(payload?.name || payload?.title || "").trim();
    const score = scoreTitleMatch({
      candidateTitle,
      productName: product.name,
      keywords: product.keywords || [],
    });

    if (!Number.isFinite(score) || score < minMatchScore) return null;

    const price = normalizeScrapedPrice(Number(payload?.price));
    if (!price) return { status: "no_price" };

    return {
      status: "ok",
      price,
      title: candidateTitle || product.name,
      href: `${apiBase}/products/${encodeURIComponent(slug)}`,
      matchScore: score,
      priceHistory: sanitizePriceHistory(payload?.priceHistory) || undefined,
      _capturedFromApi: true,
    };
  } catch {
    return null;
  }
}

async function scrapeProduct({ page, source, product, minMatchScore }) {
  // Prefer canonical product pages when the app uses stable slugs like:
  //   http://localhost:5173/product/sony-wh-xb910n
  // This avoids unreliable search result harvesting on SPAs.
  const direct = await scrapeProductDirect({ page, source, product, minMatchScore });
  // Only short-circuit on success. If direct fails (no_price/no_match),
  // fall back to search-based discovery.
  if (direct?.status === "ok") return direct;

  // Container fallback: when frontend rendering/API wiring differs in Docker,
  // pull product details from source API endpoint directly.
  const apiFallback = await scrapeProductViaApi({ source, product, minMatchScore });
  if (apiFallback?.status === "ok") return apiFallback;

  const best = await scrapeProductFromSearch({ page, source, product });
  if (!best) return { status: "no_match" };

  if ((best.score ?? 0) < minMatchScore) {
    logger.warn("crawler.low_match_score", {
      site: source.site,
      productId: product.productId,
      bestTitle: normalizeText(best.title),
      score: best.score,
      minMatchScore,
    });
    return { status: "no_match" };
  }

  const details = await scrapeFinalProductPage({ page, candidate: best });
  if (!details || !details.price || !Number.isFinite(details.price)) {
    logger.warn("crawler.missing_price", {
      site: source.site,
      productId: product.productId,
      href: best.href,
      title: details?.title || "",
    });
    return { status: "no_price" };
  }

  return {
    status: "ok",
    price: normalizeScrapedPrice(details.price),
    title: details.title || best.title || product.name,
    href: best.href,
    matchScore: best.score,
  };
}

module.exports = { scrapeProduct };

