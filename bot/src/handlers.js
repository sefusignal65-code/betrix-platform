const AIService = require('./services/ai.service');
const logging = require('./services/logging.service');

// Register all bot handlers on a provided bot instance
function registerHandlers(bot) {
    const botStats = {
        totalUsers: 0,
        activeUsers: new Set(),
        messageCount: 0,
        aiRequests: 0
    };

    // Basic commands
    bot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;
        const username = msg.from.username || msg.from.first_name;

        try {
            await bot.sendMessage(chatId,
                `Welcome to BETRIX AI, ${username}! 🚀\n\nI'm your AI-powered betting assistant. Use /help to see all available commands.`
            );
        } catch (e) {
            logging.error('Failed to handle /start', e);
        }
    });

    bot.onText(/\/help/, async (msg) => {
        const chatId = msg.chat.id;
        try {
            await bot.sendMessage(chatId,
                '🤖 BETRIX AI Bot Commands:\n\n/ start - Start the bot\n/predict [match] - Get AI prediction\n/analyze [team/player] - Statistical analysis\n/status - Check subscription status'
            );
        } catch (e) { logging.error('Help handler error', e); }
    });

    // Prediction and analysis use AIService
    bot.onText(/\/predict (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        const query = match[1];

        try {
            await bot.sendMessage(chatId, '🔄 Analyzing match data and generating prediction...');
            const response = await AIService.generateResponse(query, msg.from.id, { type: 'predict' });
            botStats.aiRequests++;
            await bot.sendMessage(chatId, `🎯 *Match Prediction*\n\n${response}`, { parse_mode: 'Markdown' });
        } catch (e) { logging.error('Predict handler error', e); await bot.sendMessage(chatId, '⚠️ Prediction failed.'); }
    });

    bot.onText(/\/analyze (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        const query = match[1];
        try {
            await bot.sendMessage(chatId, '📊 Gathering statistical data...');
            const response = await AIService.generateResponse(query, msg.from.id, { type: 'analyze' });
            botStats.aiRequests++;
            await bot.sendMessage(chatId, `📈 *Statistical Analysis*\n\n${response}`, { parse_mode: 'Markdown' });
        } catch (e) { logging.error('Analyze handler error', e); await bot.sendMessage(chatId, '⚠️ Analysis failed.'); }
    });

    bot.on('polling_error', (error) => {
        logging.error('Polling error', error);
    });

    // Generic message logger
    bot.on('message', (msg) => {
        botStats.messageCount++;
        botStats.activeUsers.add(msg.from.id);
        logging.info('Received message', { user: msg.from.id, text: msg.text });
    });

    console.log('Handlers registered for Telegram bot');
}

module.exports = { registerHandlers };
