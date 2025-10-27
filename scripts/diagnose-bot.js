const axios = require('axios');
require('dotenv').config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function diagnoseBot() {
    if (!BOT_TOKEN) {
        console.error('❌ TELEGRAM_BOT_TOKEN not found in environment');
        console.log('Please ensure you have created a .env file with your bot token');
        return;
    }

    try {
        // Step 1: Verify bot token by getting bot info
        console.log('🔍 Checking bot token...');
        const botInfo = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
        console.log('✅ Bot token is valid!');
        console.log('Bot Info:', {
            username: botInfo.data.result.username,
            bot_id: botInfo.data.result.id,
            can_join_groups: botInfo.data.result.can_join_groups,
            can_read_messages: botInfo.data.result.can_read_all_group_messages
        });

        // Step 2: Check current webhook status
        console.log('\n🔍 Checking webhook status...');
        const webhookInfo = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
        console.log('Current Webhook Info:', {
            url: webhookInfo.data.result.url,
            has_custom_certificate: webhookInfo.data.result.has_custom_certificate,
            pending_update_count: webhookInfo.data.result.pending_update_count,
            last_error_date: webhookInfo.data.result.last_error_date,
            last_error_message: webhookInfo.data.result.last_error_message,
            max_connections: webhookInfo.data.result.max_connections
        });

        // Step 3: Check for pending updates
        console.log('\n🔍 Checking for pending updates...');
        const updates = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?limit=1&offset=-1`);
        if (updates.data.result.length > 0) {
            console.log('Last update:', {
                update_id: updates.data.result[0].update_id,
                message: updates.data.result[0].message,
                timestamp: new Date(updates.data.result[0].message.date * 1000).toISOString()
            });
        } else {
            console.log('No pending updates found');
        }

    } catch (error) {
        if (error.response) {
            console.error('❌ API Error:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
            });
        } else if (error.request) {
            console.error('❌ Network Error: No response received');
            console.error(error.message);
        } else {
            console.error('❌ Error:', error.message);
        }
    }
}

diagnoseBot().catch(console.error);