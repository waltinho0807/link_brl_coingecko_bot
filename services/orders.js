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

module.exports = {
  get24hChange,
  getCurrentPrice,
};
