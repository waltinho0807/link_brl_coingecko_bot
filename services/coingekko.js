const axios = require('axios');

async function get24hChange(symbol = 'chainlink', vs_currency = 'brl') {
  const url = `https://api.coingecko.com/api/v3/coins/${symbol}`;
  const { data } = await axios.get(url);
  return data.market_data.price_change_percentage_24h_in_currency[vs_currency];
}

async function getCurrentPrice(symbol = 'chainlink', vs_currency = 'brl') {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=${vs_currency}`;
  const { data } = await axios.get(url);
  return data[symbol][vs_currency];
}

async function getHistoricalPrices(symbol, currency, days) {
  const url = `https://api.coingecko.com/api/v3/coins/${symbol}/market_chart?vs_currency=${currency}&days=${days}`;
  const { data } = await axios.get(url);
  return data.prices.map(([timestamp, price]) => ({
    date: new Date(timestamp).toISOString().slice(0, 10),
    price,
  }));
}

module.exports = {
  get24hChange,
  getCurrentPrice,
  getHistoricalPrices,
};
