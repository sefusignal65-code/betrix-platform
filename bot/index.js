const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const { registerHandlers } = require('./src/handlers');

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
    console.error('TELEGRAM_BOT_TOKEN not set - bot cannot start');
    process.exit(1);
}

// Default to polling when running as a long-lived process (local/dev). For serverless/webhook use, set USE_WEBHOOK=true
const useWebhook = process.env.USE_WEBHOOK === 'true';
const bot = new TelegramBot(token, { polling: !useWebhook });

// Register handlers (shared for polling or webhook processing)
registerHandlers(bot);

console.log(`BETRIX AI Bot started (polling=${!useWebhook})`);