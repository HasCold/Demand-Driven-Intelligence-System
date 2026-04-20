const { PriceSettlerWorker } = require("./services/priceSettlerWorker");

const priceSettlerWorker = new PriceSettlerWorker();

module.exports = { priceSettlerWorker };
