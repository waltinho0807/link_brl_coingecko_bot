require('dotenv').config();
const fs = require('fs');
const { getHistoricalPrices } = require('./services/coingekko');

const symbol = 'chainlink';
const currency = 'brl';
const days = 30;
const dropThreshold = -3;
const profitTargetPercent = 0.03;
const stopLossPercent = 0.02;
const orderAmount = 100;

const results = [];

async function runBacktest() {
  const prices = await getHistoricalPrices(symbol, currency, days);
  let position = null;
  let totalProfit = 0;
  let totalTrades = 0;
  let wins = 0;

  for (let i = 1; i < prices.length; i++) {
    const priceNow = prices[i].price;
    const priceYesterday = prices[i - 1].price;
    const change = ((priceNow - priceYesterday) / priceYesterday) * 100;

    if (!position && change <= dropThreshold) {
      position = {
        entryPrice: priceNow,
        amount: orderAmount / priceNow,
        entryDate: prices[i].date,
      };
      console.log(`🛒 Compra simulada a R$${priceNow.toFixed(2)} em ${prices[i].date}`);
    }

    if (position) {
      const currentValue = priceNow * position.amount;
      const entryValue = position.entryPrice * position.amount;
      const pnl = currentValue - entryValue;
      const pnlPercent = pnl / entryValue;

      if (pnlPercent >= profitTargetPercent || pnlPercent <= -stopLossPercent) {
        totalTrades++;
        totalProfit += pnl;
        if (pnl > 0) wins++;

        const status = pnl > 0 ? '✅ lucro' : '❌ prejuízo';
        console.log(`💼 Venda simulada a R$${priceNow.toFixed(2)} em ${prices[i].date} com ${status} de R$${pnl.toFixed(2)}`);

        results.push({
          entryDate: position.entryDate,
          entryPrice: position.entryPrice,
          exitDate: prices[i].date,
          exitPrice: priceNow,
          amount: position.amount,
          pnl: pnl.toFixed(2),
          pnlPercent: (pnlPercent * 100).toFixed(2),
          result: status,
        });

        position = null;
      }
    }
  }

  const winRate = (wins / totalTrades) * 100;

  const summary = {
    symbol,
    currency,
    totalTrades,
    wins,
    winRate: isNaN(winRate) ? '0.00' : winRate.toFixed(2),
    totalProfit: totalProfit.toFixed(2),
  };

  console.log(`\n📈 Backtest concluído para ${symbol.toUpperCase()}/${currency.toUpperCase()}`);
  console.log(`Total de trades: ${totalTrades}`);
  console.log(`Trades com lucro: ${wins}`);
  console.log(`Porcentagem de acerto: ${summary.winRate}%`);
  console.log(`Lucro total: R$${summary.totalProfit}`);

  // Salvar resultados no arquivo JSON
  fs.writeFileSync('backtest_results.json', JSON.stringify({ summary, operations: results }, null, 2));
  console.log(`📁 Resultados salvos em backtest_results.json`);
}

runBacktest();
