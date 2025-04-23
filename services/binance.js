const ccxt = require('ccxt');
const { TRADE_AMOUNT_BRL } = require('../config');

const binance = new ccxt.binance({
  apiKey: process.env.BINANCE_API_KEY,
  secret: process.env.BINANCE_SECRET,
  enableRateLimit: true,
});

async function createBuyOrder(symbol, price) {
  const amount = TRADE_AMOUNT_BRL / price;
  return await binance.createLimitBuyOrder(symbol, amount, price);
}

async function getOrderStatus(orderId, symbol) {
  return await binance.fetchOrder(orderId, symbol);
}

async function createSellOrder(symbol, price, amount) {
  return await binance.createLimitSellOrder(symbol, amount, price);
}

module.exports = {
  createBuyOrder,
  getOrderStatus,
  createSellOrder,
};
