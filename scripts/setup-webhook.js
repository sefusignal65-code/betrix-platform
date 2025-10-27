const axios = require('axios');
require('dotenv').config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!BOT_TOKEN) {
    console.error('Error: TELEGRAM_BOT_TOKEN not set in environment');
    process.exit(1);
}

async function setupWebhook() {
    try {
        // First, get current webhook info
        const infoResponse = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
        console.log('Current webhook info:', infoResponse.data);

        // Set new webhook
        const webhookUrl = 'https://betrix-platform.vercel.app/api/bot/webhook';
        const response = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
            url: webhookUrl,
            secret_token: WEBHOOK_SECRET,
            allowed_updates: ['message', 'callback_query']
        });

        console.log('Webhook setup response:', response.data);

        // Verify the setup
        const verifyResponse = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
        console.log('Verification:', verifyResponse.data);
    } catch (error) {
        console.error('Error setting up webhook:', error.response?.data || error.message);
    }
}

setupWebhook();