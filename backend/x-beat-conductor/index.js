const { CrawlerWorker } = require("./services/crawlerWorker");

const crawlerWorker = new CrawlerWorker();

module.exports = { crawlerWorker };

