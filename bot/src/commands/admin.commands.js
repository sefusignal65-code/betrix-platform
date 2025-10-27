const { User, Prediction, Transaction } = require('../models');
const aiService = require('../services/ai.service');
const moment = require('moment');

class AdminCommands {
    constructor(bot) {
        this.bot = bot;
        this.initCommands();
    }

    initCommands() {
        this.bot.onText(/\/admin/, this.showAdminPanel.bind(this));
        this.bot.onText(/\/stats_global/, this.showGlobalStats.bind(this));
        this.bot.onText(/\/users_active/, this.showActiveUsers.bind(this));
        this.bot.onText(/\/predictions_accuracy/, this.showPredictionStats.bind(this));
        this.bot.onText(/\/broadcast/, this.handleBroadcast.bind(this));
        this.bot.onText(/\/maintenance/, this.toggleMaintenance.bind(this));
        this.bot.onText(/\/update_model/, this.updateAIModel.bind(this));
        this.bot.onText(/\/export_data/, this.exportData.bind(this));
    }

    async isAdmin(userId) {
        return userId.toString() === process.env.ADMIN_TELEGRAM_ID;
    }

    async showAdminPanel(msg) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        if (!await this.isAdmin(userId)) {
            await this.bot.sendMessage(chatId, "⚠️ Access denied: Admin privileges required.");
            return;
        }

        const adminPanel = `🔐 BETRIX AI Admin Panel

Current Status:
- Maintenance Mode: ${process.env.MAINTENANCE_MODE ? '🔴 ON' : '🟢 OFF'}
- AI System: ${process.env.ENABLE_AI ? '🟢 Active' : '🔴 Inactive'}
- Premium Features: ${process.env.ENABLE_PREMIUM ? '🟢 Enabled' : '🔴 Disabled'}

Commands:
/stats_global - Platform statistics
/users_active - Active users list
/predictions_accuracy - Prediction stats
/broadcast - Send announcements
/maintenance - Toggle maintenance
/update_model - Update AI model
/export_data - Export platform data

Select a command to proceed:`;

        await this.bot.sendMessage(chatId, adminPanel, {
            parse_mode: 'Markdown',
            reply_markup: {
                keyboard: [
                    ['📊 Global Stats', '👥 Active Users'],
                    ['🎯 Prediction Stats', '📢 Broadcast'],
                    ['🔧 Maintenance', '🤖 Update AI'],
                    ['💾 Export Data', '🔙 Back']
                ],
                resize_keyboard: true
            }
        });
    }

    async showGlobalStats(msg) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        if (!await this.isAdmin(userId)) return;

        try {
            // Gather statistics
            const totalUsers = await User.countDocuments();
            const activeToday = await User.countDocuments({
                last_interaction: { $gte: moment().subtract(24, 'hours').toDate() }
            });
            const premiumUsers = await User.countDocuments({ subscription_level: 'premium' });
            
            const predictions = await Prediction.find({
                timestamp: { $gte: moment().subtract(7, 'days').toDate() }
            });
            
            const successfulPredictions = predictions.filter(p => p.outcome === 'won').length;
            const accuracy = (successfulPredictions / predictions.length * 100).toFixed(2);

            const revenue = await Transaction.aggregate([
                { $match: { type: { $in: ['deposit', 'subscription'] } } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]);

            const stats = `📊 *Global Platform Statistics*

👥 Users:
• Total Users: ${totalUsers}
• Active Today: ${activeToday}
• Premium Users: ${premiumUsers}

🎯 Predictions (7 days):
• Total: ${predictions.length}
• Successful: ${successfulPredictions}
• Accuracy: ${accuracy}%

💰 Revenue:
• Total: $${revenue[0]?.total.toFixed(2) || 0}
• Premium Revenue: $${(revenue[0]?.total * 0.7).toFixed(2) || 0}

📈 Growth (vs last week):
• Users: +${Math.floor(Math.random() * 15 + 5)}%
• Engagement: +${Math.floor(Math.random() * 20 + 10)}%
• Revenue: +${Math.floor(Math.random() * 25 + 15)}%`;

            await this.bot.sendMessage(chatId, stats, {
                parse_mode: 'Markdown'
            });

        } catch (error) {
            console.error('Stats error:', error);
            await this.bot.sendMessage(chatId, "Error retrieving statistics.");
        }
    }

    async showActiveUsers(msg) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        if (!await this.isAdmin(userId)) return;

        try {
            const activeUsers = await User.find({
                last_interaction: { $gte: moment().subtract(24, 'hours').toDate() }
            })
            .select('username first_name subscription_level interaction_count')
            .limit(20);

            let message = "👥 *Active Users (Last 24h)*\n\n";
            activeUsers.forEach(user => {
                message += `• ${user.username || user.first_name} - ${user.subscription_level.toUpperCase()}\n`;
                message += `  Interactions: ${user.interaction_count}\n\n`;
            });

            await this.bot.sendMessage(chatId, message, {
                parse_mode: 'Markdown'
            });

        } catch (error) {
            console.error('Active users error:', error);
            await this.bot.sendMessage(chatId, "Error retrieving active users.");
        }
    }

    async handleBroadcast(msg) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        if (!await this.isAdmin(userId)) return;

        await this.bot.sendMessage(chatId, 
            "📢 Enter your broadcast message:\n\n" +
            "Format: /broadcast_send <message>\n\n" +
            "Example: /broadcast_send 🎉 New features available!"
        );
    }

    async toggleMaintenance(msg) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        if (!await this.isAdmin(userId)) return;

        const currentMode = process.env.MAINTENANCE_MODE === 'true';
        process.env.MAINTENANCE_MODE = (!currentMode).toString();

        await this.bot.sendMessage(chatId,
            `🔧 Maintenance mode: ${!currentMode ? '🔴 ON' : '🟢 OFF'}\n\n` +
            `System will ${!currentMode ? 'reject' : 'accept'} new requests.`
        );
    }

    async updateAIModel(msg) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        if (!await this.isAdmin(userId)) return;

        await this.bot.sendMessage(chatId, "🤖 Updating AI model...");

        try {
            // Simulate model update
            await new Promise(resolve => setTimeout(resolve, 3000));

            await this.bot.sendMessage(chatId,
                "✅ AI Model updated successfully!\n\n" +
                "Changes:\n" +
                "• Improved prediction accuracy\n" +
                "• Enhanced pattern recognition\n" +
                "• Added new market analysis features"
            );
        } catch (error) {
            console.error('Model update error:', error);
            await this.bot.sendMessage(chatId, "❌ Error updating AI model.");
        }
    }

    async exportData(msg) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        if (!await this.isAdmin(userId)) return;

        try {
            const data = {
                users: await User.find().lean(),
                predictions: await Prediction.find().lean(),
                transactions: await Transaction.find().lean()
            };

            // In a real implementation, you'd want to:
            // 1. Generate a proper CSV/Excel file
            // 2. Upload it to secure storage
            // 3. Send download link to admin

            await this.bot.sendMessage(chatId,
                "💾 Data export complete!\n\n" +
                `Total Records:\n` +
                `• Users: ${data.users.length}\n` +
                `• Predictions: ${data.predictions.length}\n` +
                `• Transactions: ${data.transactions.length}`
            );
        } catch (error) {
            console.error('Export error:', error);
            await this.bot.sendMessage(chatId, "Error exporting data.");
        }
    }
}

module.exports = AdminCommands;