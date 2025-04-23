const mongoose = require('mongoose');

async function connectDB() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB conectado');
}

// 📌 Schema com campo opcional de vínculo entre ordens
const orderSchema = new mongoose.Schema({
  type: String, // 'buy' ou 'sell'
  symbol: String,
  price: Number,
  amount: Number,
  status: String,
  relatedBuyOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  createdAt: { type: Date, default: Date.now },
});

const Order = mongoose.model('Order', orderSchema);

// 💾 Salvar nova ordem
async function saveOrder(data) {
  const order = new Order(data);
  await order.save();
}

// 🔍 Verifica se há ordem de compra pendente
async function hasPendingBuyOrder(symbol) {
  const openOrders = await Order.find({
    type: 'buy',
    symbol,
    status: { $in: ['open', 'new'] },
  });
  return openOrders.length > 0;
}

// 🔍 Verifica se existe qualquer ordem pendente (compra ou venda)
async function hasPendingOrder(symbol) {
  const openOrders = await Order.find({
    symbol,
    status: { $in: ['open', 'new'] },
  });
  return openOrders.length > 0;
}

// 🔁 Retorna última ordem de compra concluída
async function getLastFilledBuyOrder(symbol) {
  return await Order.findOne({
    symbol,
    type: 'buy',
    status: 'closed'
  }).sort({ createdAt: -1 });
}

// 🔍 Verifica se já existe ordem de venda para a ordem de compra
async function hasSellOrderForBuyOrder(buyOrderId) {
  const order = await Order.findOne({
    type: 'sell',
    relatedBuyOrderId: buyOrderId
  });
  return !!order;
}

module.exports = {
  connectDB,
  saveOrder,
  hasPendingBuyOrder,
  hasPendingOrder,
  getLastFilledBuyOrder,
  hasSellOrderForBuyOrder,
};
