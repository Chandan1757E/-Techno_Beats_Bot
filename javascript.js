const express = require('express');
const webSocket = require('ws');
const http = require('http')
const telegramBot = require('node-telegram-bot-api')
const uuid4 = require('uuid')
const multer = require('multer');
const bodyParser = require('body-parser')
const axios = require("axios");

// Use environment variables
const token = process.env.TELEGRAM_BOT_TOKEN || '8458876632:AAFYa27fG7rnAiH6BBSKOkmpviWcQbmFSO4';
const id = process.env.TELEGRAM_CHAT_ID || '6576599231';
const address = process.env.HEALTH_CHECK_URL || 'https://www.youtube.com';
const PORT = process.env.PORT || 22222;
const BASE_URL = process.env.BASE_URL || `https://your-domain.com`; // Change this to your actual domain

const app = express();
const appServer = http.createServer(app);
const appSocket = new webSocket.Server({server: appServer});

// Use webhook instead of polling
const appBot = new telegramBot(token, { 
  webHook: {
    port: PORT,
    host: '0.0.0.0'
  }
});

// Set webhook URL (you need to configure this with your actual domain)
appBot.setWebHook(`${BASE_URL}/bot${token}`);

// ... rest of your code remains the same

// Add webhook endpoint
app.post(`/bot${token}`, (req, res) => {
  appBot.processUpdate(req.body);
  res.sendStatus(200);
});

appServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});