require('dotenv').config();
const { get24hChange, getCurrentPrice } = require('./services/coingekko');
const { createBuyOrder, createSellOrder } = require('./services/binance');
const { sendTelegramMessage } = require('./services/telegram');
const { connectDB, saveOrder, hasPendingOrder, getLastFilledBuyOrder, hasSellOrderForBuyOrder } = require('./db');
const { SYMBOL, DROP_THRESHOLD } = require('./config');

async function main() {
  await connectDB();

  // 🔎 Verifica se há ordem de compra concluída sem ordem de venda vinculada
  const lastFilledBuy = await getLastFilledBuyOrder(SYMBOL);

  if (lastFilledBuy) {
    const hasSell = await hasSellOrderForBuyOrder(lastFilledBuy._id);
    if (!hasSell) {
      const amountToSell = lastFilledBuy.amount * 0.999; // subtrai 0.1%
      const sellPrice = lastFilledBuy.price * 1.03; // aumenta 3%
      const stopLossPrice = lastFilledBuy.price * 0.97;   // prejuízo de 3%

      const currentPrice = await getCurrentPrice('chainlink', 'brl');
      console.log(`💹 Preço atual LINK/BRL: R$${currentPrice.toFixed(2)}`);
      console.log(`🎯 Alvo: R$${sellPrice.toFixed(2)} | 🛑 Stop: R$${stopLossPrice.toFixed(2)}`);

      if (currentPrice >= sellPrice || currentPrice <= stopLossPrice) {
        const reason = currentPrice >= sellPrice ? 'lucro' : 'stop loss';
        const sellOrder = await createSellOrder(SYMBOL, currentPrice, amountToSell); // melhor usar currentPrice real
        console.log(`💼 Ordem de venda criada (${reason}):`, sellOrder);

        const pnl = (currentPrice - lastFilledBuy.price) * amountToSell; // calcula lucro/prejuízo

        await saveOrder({
          type: 'sell',
          symbol: SYMBOL,
          price: currentPrice,
          amount: amountToSell,
          status: sellOrder.status,
          relatedBuyOrderId: lastFilledBuy._id,
        });

        await sendTelegramMessage(`💼 Venda realizada a R$${currentPrice.toFixed(2)} com resultado de R$${pnl.toFixed(2)}.`);

        return;

      } else {
        console.log('⏳ Aguardando atingir alvo de venda ou stop loss...');
        return;
      }
    }
  }

  // 🛑 Verifica se temos qualquer ordem pendente
  const pending = await hasPendingOrder(SYMBOL);
  if (pending) {
    console.log('⏳ Temos ordens pendentes. Aguardando conclusão antes de prosseguir.');
    return;
  }

  // 📊 Verifica condição de compra
  const change = await get24hChange('chainlink', 'brl');
  console.log(`📉 Variação 24h de LINK/BRL: ${change.toFixed(2)}%`);

  if (change <= DROP_THRESHOLD) {
    const price = await getCurrentPrice('chainlink', 'brl');
    console.log(`💸 Preço atual LINK/BRL: R$${price.toFixed(2)}`);

    const buyOrder = await createBuyOrder(SYMBOL, price);
    console.log(`🛒 Ordem de compra criada:`, buyOrder);

    await sendTelegramMessage(`🛒 Compra realizada a R$${price.toFixed(2)} (${SYMBOL})`);

    await saveOrder({
      type: 'buy',
      symbol: SYMBOL,
      price,
      amount: buyOrder.amount,
      status: buyOrder.status,
    });
  } else {
    console.log('🔍 Sem oportunidade de compra no momento.');
  }
}

// ⏱ Executa a cada 5 minutos
setInterval(main, 5 * 60 * 1000);
main();