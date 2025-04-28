require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { connectDB, saveOrder, hasPendingOrder, getLastFilledBuyOrder, hasSellOrderForBuyOrder } = require('../db');
const {sendTelegramMessage} = require('../services/telegram')

// Função para enviar mensagem ao Telegram
async function enviarMensagemTelegram(mensagem) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    await axios.post(url, {
      chat_id: chatId,
      text: mensagem,
    });
    console.log('✅ Mensagem enviada com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error.message);
  }
}

// Função para simular salvar operação
function salvarOperacao(dadosCompra) {
  const caminho = path.join(__dirname, 'operacoes.json');
  
  let operacoes = [];

  if (fs.existsSync(caminho)) {
    const dadosExistentes = fs.readFileSync(caminho, 'utf-8');
    operacoes = JSON.parse(dadosExistentes);
  }

  operacoes.push(dadosCompra);

  fs.writeFileSync(caminho, JSON.stringify(operacoes, null, 2));
  console.log('✅ Operação salva com sucesso!');
}

// 🔥 Teste de envio de mensagem
async function testarOperacao() {
  await connectDB();

  const operacao = {
  "type": "buy",
  "symbol": "LINK/BRL",
  "price": 70.40,
  "amount": 10,
  "status": "open",
  "relatedBuyOrderId": null,
  "createdAt": "2025-04-28T12:00:00Z"
}


  // Primeiro envia mensagem no Telegram
  await sendTelegramMessage(`💰 Nova operação: ${operacao.side} ${operacao.amount} ${operacao.symbol} a R$${operacao.price}`);

  // Depois salva a operação no MongoDB Atlas
  await saveOrder(operacao);
}

testarOperacao();


