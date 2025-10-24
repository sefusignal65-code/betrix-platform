const TelegramBot = require('node-telegram-bot-api');
const OpenAI = require('openai');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Store for user states and admin sessions
const userStates = new Map();
const adminSessions = new Map();

// Admin commands list
const ADMIN_COMMANDS = {
    '/admin': 'Access admin panel',
    '/broadcast': 'Send message to all users',
    '/stats': 'View bot statistics',
    '/users': 'List all users',
    '/ban': 'Ban a user',
    '/unban': 'Unban a user',
    '/setai': 'Configure AI settings'
};

const USER_COMMANDS = {
    '/start': 'Start using the bot',
    '/help': 'Show available commands',
    '/status': 'Check subscription status',
    '/verify': 'Verify your account',
    '/predict': 'Get AI prediction for a match',
    '/analyze': 'Analyze team/player statistics',
    '/risk': 'Get risk assessment for a bet',
    '/strategy': 'Get betting strategy suggestions',
    '/odds': 'Compare odds from different sources'
};

// Track user statistics
const botStats = {
    totalUsers: 0,
    activeUsers: new Set(),
    messageCount: 0,
    aiRequests: 0
};

// Command handlers
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const username = msg.from.username || msg.from.first_name;

    await bot.sendMessage(chatId, 
        `Welcome to BETRIX AI, ${username}! 🚀\n\n` +
        "I'm your AI-powered betting assistant. Let's get you started:\n\n" +
        "1️⃣ Join our channel for updates: @BetrixAIChannel\n" +
        "2️⃣ Complete verification\n" +
        "3️⃣ Access premium features\n\n" +
        "Use /help to see all available commands."
    );
});

bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    
    await bot.sendMessage(chatId,
        "🤖 BETRIX AI Bot Commands:\n\n" +
        "🔹 Basic Commands:\n" +
        "/start - Start the bot\n" +
        "/status - Check subscription status\n" +
        "/verify - Verify your account\n\n" +
        "🔹 AI Prediction Commands:\n" +
        "/predict [match] - Get AI prediction\n" +
        "/analyze [team/player] - Statistical analysis\n" +
        "/risk [bet details] - Risk assessment\n" +
        "/strategy [preferences] - Betting strategy\n" +
        "/odds [match] - Compare betting odds\n\n" +
        "Need assistance? Contact @BetrixSupport"
    );
});

bot.onText(/\/status/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
        // Check if user is admin
        if (userId.toString() === process.env.ADMIN_TELEGRAM_ID) {
            await bot.sendMessage(chatId, "🌟 Admin Status: Active\n✅ Full access granted");
            return;
        }

        // Check channel subscription
        const chatMember = await bot.getChatMember('@BetrixAIChannel', userId);
        
        if (['creator', 'administrator', 'member'].includes(chatMember.status)) {
            await bot.sendMessage(chatId, 
                "✅ Your BETRIX AI Status:\n\n" +
                "📢 Channel Subscription: Active\n" +
                "🔄 Account Status: Verified\n" +
                "⭐ Access Level: Premium\n\n" +
                "Visit our website to access all features!"
            );
        } else {
            await bot.sendMessage(chatId,
                "❌ Not subscribed to channel\n\n" +
                "Please join @BetrixAIChannel to access our services.\n" +
                "After joining, use /verify to confirm your subscription."
            );
        }
    } catch (error) {
        console.error('Status check error:', error);
        await bot.sendMessage(chatId, "⚠️ Error checking status. Please try again later.");
    }
});

bot.onText(/\/verify/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
        const chatMember = await bot.getChatMember('@BetrixAIChannel', userId);
        
        if (['creator', 'administrator', 'member'].includes(chatMember.status)) {
            // Generate verification token
            const verificationToken = generateToken(userId);
            
            await bot.sendMessage(chatId,
                "✅ Verification successful!\n\n" +
                "Your account is now verified and ready to use.\n" +
                `Verification Code: ${verificationToken}\n\n` +
                "Visit our website to access premium features!"
            );
        } else {
            await bot.sendMessage(chatId,
                "❌ Verification failed\n\n" +
                "Please make sure you:\n" +
                "1. Join @BetrixAIChannel\n" +
                "2. Stay subscribed to the channel\n" +
                "3. Try verification again with /verify"
            );
        }
    } catch (error) {
        console.error('Verification error:', error);
        await bot.sendMessage(chatId, "⚠️ Error during verification. Please try again later.");
    }
});

// Helper function to generate verification token
function generateToken(userId) {
    return Buffer.from(`${userId}-${Date.now()}`).toString('base64');
}

// Admin command handlers
bot.onText(/\/admin/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (userId.toString() !== process.env.ADMIN_TELEGRAM_ID) {
        await bot.sendMessage(chatId, "⛔ Access denied: Admin only command");
        return;
    }

    const adminKeyboard = {
        reply_markup: {
            inline_keyboard: [
                [{ text: "📊 Statistics", callback_data: "admin_stats" }],
                [{ text: "📢 Broadcast", callback_data: "admin_broadcast" }],
                [{ text: "👥 User Management", callback_data: "admin_users" }],
                [{ text: "🤖 AI Settings", callback_data: "admin_ai" }]
            ]
        }
    };

    await bot.sendMessage(
        chatId,
        "🔐 *BETRIX Admin Panel*\n\nWelcome back, Admin! What would you like to do?",
        { parse_mode: "Markdown", ...adminKeyboard }
    );
});

// Handle admin callback queries
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const userId = query.from.id;

    if (userId.toString() !== process.env.ADMIN_TELEGRAM_ID) {
        await bot.answerCallbackQuery(query.id, "⛔ Access denied: Admin only");
        return;
    }

    switch (query.data) {
        case 'admin_stats':
            const stats = `📊 *Bot Statistics*\n\n` +
                `👥 Total Users: ${botStats.totalUsers}\n` +
                `✨ Active Users: ${botStats.activeUsers.size}\n` +
                `💬 Messages Processed: ${botStats.messageCount}\n` +
                `🤖 AI Requests: ${botStats.aiRequests}`;
            
            await bot.editMessageText(stats, {
                chat_id: chatId,
                message_id: query.message.message_id,
                parse_mode: 'Markdown'
            });
            break;

        case 'admin_broadcast':
            adminSessions.set(userId, 'awaiting_broadcast');
            await bot.editMessageText(
                "📢 *Broadcast Message*\n\nPlease enter the message you want to broadcast to all users:",
                {
                    chat_id: chatId,
                    message_id: query.message.message_id,
                    parse_mode: 'Markdown'
                }
            );
            break;

        case 'admin_ai':
            const aiSettings = {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "🎯 Set AI Accuracy", callback_data: "ai_accuracy" }],
                        [{ text: "⚡ Toggle Fast Mode", callback_data: "ai_fast_mode" }],
                        [{ text: "📊 View AI Stats", callback_data: "ai_stats" }]
                    ]
                }
            };
            
            await bot.editMessageText(
                "🤖 *AI Settings*\n\nConfigure how the AI responds to user queries:",
                {
                    chat_id: chatId,
                    message_id: query.message.message_id,
                    parse_mode: 'Markdown',
                    ...aiSettings
                }
            );
            break;
    }
});

// AI prediction handler
async function getAIPrediction(query, type) {
    try {
        let systemPrompt;
        switch (type) {
            case 'predict':
                systemPrompt = "You are BETRIX AI, an expert betting analysis system. Provide precise, data-driven match predictions with detailed reasoning.";
                break;
            case 'analyze':
                systemPrompt = "You are BETRIX AI, focusing on in-depth statistical analysis of teams and players. Consider recent form, head-to-head records, and relevant performance metrics.";
                break;
            case 'risk':
                systemPrompt = "You are BETRIX AI, assessing betting risks. Evaluate odds, potential outcomes, and provide a risk score from 1-10 with detailed explanation.";
                break;
            case 'strategy':
                systemPrompt = "You are BETRIX AI, providing personalized betting strategies. Consider bankroll management, odds evaluation, and long-term profitability.";
                break;
            case 'odds':
                systemPrompt = "You are BETRIX AI, comparing betting odds from major bookmakers. Identify value bets and potential arbitrage opportunities.";
                break;
            default:
                systemPrompt = "You are BETRIX AI, an expert betting analysis system. Provide precise, data-driven predictions and analysis.";
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: query
                }
            ],
            temperature: 0.7,
            max_tokens: 800
        });

        botStats.aiRequests++;
        return completion.choices[0].message.content;
    } catch (error) {
        console.error('AI Error:', error);
        return "⚠️ AI service temporarily unavailable. Please try again later.";
    }
}

// Handle match predictions
bot.onText(/\/predict (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const query = match[1];

    await bot.sendMessage(chatId, "🔄 Analyzing match data and generating prediction...");
    const prediction = await getAIPrediction(query, 'predict');
    
    await bot.sendMessage(chatId, `🎯 *Match Prediction*\n\n${prediction}`, { parse_mode: 'Markdown' });
});

// Handle team/player analysis
bot.onText(/\/analyze (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const query = match[1];

    await bot.sendMessage(chatId, "📊 Gathering statistical data...");
    const analysis = await getAIPrediction(query, 'analyze');
    
    await bot.sendMessage(chatId, `📈 *Statistical Analysis*\n\n${analysis}`, { parse_mode: 'Markdown' });
});

// Handle risk assessment
bot.onText(/\/risk (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const query = match[1];

    await bot.sendMessage(chatId, "⚖️ Calculating risk factors...");
    const assessment = await getAIPrediction(query, 'risk');
    
    await bot.sendMessage(chatId, `⚠️ *Risk Assessment*\n\n${assessment}`, { parse_mode: 'Markdown' });
});

// Handle strategy suggestions
bot.onText(/\/strategy(.*)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const query = match[1].trim() || "General betting strategy advice";

    await bot.sendMessage(chatId, "🎲 Developing betting strategy...");
    const strategy = await getAIPrediction(query, 'strategy');
    
    await bot.sendMessage(chatId, `📋 *Betting Strategy*\n\n${strategy}`, { parse_mode: 'Markdown' });
});

// Handle odds comparison
bot.onText(/\/odds (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const query = match[1];

    await bot.sendMessage(chatId, "💱 Comparing odds across bookmakers...");
    const oddsComparison = await getAIPrediction(query, 'odds');
    
    await bot.sendMessage(chatId, `📊 *Odds Comparison*\n\n${oddsComparison}`, { parse_mode: 'Markdown' });
});

// Error handler
bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

console.log('BETRIX AI Bot is running with Admin and AI capabilities...');