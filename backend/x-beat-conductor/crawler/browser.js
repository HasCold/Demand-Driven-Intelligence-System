const puppeteer = require("puppeteer");
const { config } = require("../config");
const { logger } = require("../utils/logger");

async function launchBrowser() {
  const browser = await puppeteer.launch({
    headless: config.crawler.headless,
    // executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-blink-features=AutomationControlled",
    ],
  });
  logger.info("crawler.browser_launched", { headless: config.crawler.headless });
  return browser;
}

async function newPage(browser) {
  const page = await browser.newPage();
  await page.setUserAgent(config.crawler.userAgent);
  await page.setViewport({ width: 1280, height: 800 });
  page.setDefaultNavigationTimeout(config.crawler.navTimeoutMs);
  page.setDefaultTimeout(config.crawler.jobTimeoutMs);
  return page;
}

module.exports = { launchBrowser, newPage };

