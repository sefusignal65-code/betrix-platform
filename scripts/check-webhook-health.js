const axios = require('axios');
require('dotenv').config();

const WEBHOOK_URL = process.env.VERCEL_URL || 'https://betrix-platform.vercel.app';
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!WEBHOOK_SECRET) {
    console.error('❌ TELEGRAM_WEBHOOK_SECRET not found in environment');
    process.exit(1);
}

async function checkHealth() {
    try {
        console.log('🔍 Checking webhook health...');
        
        const response = await axios.get(`${WEBHOOK_URL}/api/bot/webhook?health=check`, {
            headers: {
                'x-webhook-secret': WEBHOOK_SECRET
            }
        });

        if (response.data.status === 'healthy') {
            console.log('✅ Webhook is healthy!');
            console.log('Webhook Info:', {
                url: response.data.webhook.url,
                pending_updates: response.data.webhook.pending_update_count,
                last_error: response.data.webhook.last_error_message,
                max_connections: response.data.webhook.max_connections,
                allowed_updates: response.data.webhook.allowed_updates
            });
        } else {
            console.error('❌ Webhook is not healthy:', response.data);
        }

        // Check rate limits
        console.log('\n🔍 Checking rate limits...');
        const limits = await axios.get(`${WEBHOOK_URL}/api/bot/webhook?health=limits`, {
            headers: {
                'x-webhook-secret': WEBHOOK_SECRET
            }
        });
        
        if (limits.data.rateLimit) {
            console.log('Rate Limits:', limits.data.rateLimit);
        }

    } catch (error) {
        console.error('❌ Health check failed:', error.response?.data || error.message);
    }
}

checkHealth().catch(console.error);