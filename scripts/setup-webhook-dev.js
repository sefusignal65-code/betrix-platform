const axios = require('axios');
require('dotenv').config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://betrix-platform.vercel.app/api/bot/webhook';
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

async function setupWebhookDev() {
    if (!BOT_TOKEN) {
        console.error('❌ TELEGRAM_BOT_TOKEN not found in environment');
        return;
    }

    try {
        // First, delete any existing webhook
        console.log('🗑️ Removing existing webhook...');
        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook?drop_pending_updates=true`);
        
        // Set up new webhook
        console.log(`🔧 Setting up webhook at ${WEBHOOK_URL}...`);
        const response = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
            url: WEBHOOK_URL,
            secret_token: WEBHOOK_SECRET,
            allowed_updates: ['message', 'callback_query'],
            drop_pending_updates: true
        });

        if (response.data.ok) {
            console.log('✅ Webhook set up successfully!');
            console.log('Description:', response.data.description);
        } else {
            console.error('❌ Failed to set webhook:', response.data.description);
        }

        // Verify the setup
        const verify = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
        console.log('\n📡 Current Webhook Configuration:');
        console.log(JSON.stringify(verify.data.result, null, 2));

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

setupWebhookDev().catch(console.error);