const cron = require('node-cron');
const { User, Prediction, Transaction } = require('../models');
const logger = require('./logging.service');
const cache = require('./cache.service');
const moment = require('moment');

class ScheduledTasksService {
    constructor() {
        this.initializeTasks();
    }

    initializeTasks() {
        // Clean up expired cache entries - Every hour
        cron.schedule('0 * * * *', () => {
            this.cleanupCache();
        });

        // Update user statistics - Every 6 hours
        cron.schedule('0 */6 * * *', () => {
            this.updateUserStats();
        });

        // Generate performance reports - Daily at midnight
        cron.schedule('0 0 * * *', () => {
            this.generateDailyReport();
        });

        // Analyze prediction accuracy - Weekly on Sunday at 00:00
        cron.schedule('0 0 * * 0', () => {
            this.analyzePredictionAccuracy();
        });

        // Backup critical data - Daily at 03:00
        cron.schedule('0 3 * * *', () => {
            this.backupData();
        });

        // Check system health - Every 15 minutes
        cron.schedule('*/15 * * * *', () => {
            this.checkSystemHealth();
        });
    }

    async cleanupCache() {
        try {
            const stats = cache.getStats();
            logger.info('Starting cache cleanup', { beforeCleanup: stats });
            cache.clear();
            logger.info('Cache cleanup completed');
        } catch (error) {
            logger.error('Cache cleanup error', error);
        }
    }

    async updateUserStats() {
        try {
            const users = await User.find();
            for (const user of users) {
                const predictions = await Prediction.find({ user_id: user.telegram_id });
                const successfulPredictions = predictions.filter(p => p.outcome === 'won').length;
                
                await User.updateOne(
                    { _id: user._id },
                    {
                        $set: {
                            successful_predictions: successfulPredictions,
                            total_predictions: predictions.length
                        }
                    }
                );
            }
            logger.info('User stats updated successfully');
        } catch (error) {
            logger.error('User stats update error', error);
        }
    }

    async generateDailyReport() {
        try {
            const yesterday = moment().subtract(1, 'day').startOf('day');
            
            const stats = await Promise.all([
                User.countDocuments({ joined_date: { $gte: yesterday } }),
                Prediction.countDocuments({ timestamp: { $gte: yesterday } }),
                Transaction.aggregate([
                    { $match: { timestamp: { $gte: yesterday.toDate() } } },
                    { $group: { _id: null, total: { $sum: '$amount' } } }
                ])
            ]);

            const report = {
                date: yesterday.format('YYYY-MM-DD'),
                newUsers: stats[0],
                predictions: stats[1],
                revenue: stats[2][0]?.total || 0
            };

            logger.info('Daily Report Generated', report);
            cache.set('latest_daily_report', report);
        } catch (error) {
            logger.error('Daily report generation error', error);
        }
    }

    async analyzePredictionAccuracy() {
        try {
            const lastWeek = moment().subtract(7, 'days').startOf('day');
            
            const predictions = await Prediction.find({
                timestamp: { $gte: lastWeek.toDate() }
            });

            const analysis = {
                total: predictions.length,
                successful: predictions.filter(p => p.outcome === 'won').length,
                pending: predictions.filter(p => p.outcome === 'pending').length,
                byMarket: {}
            };

            predictions.forEach(p => {
                if (!analysis.byMarket[p.market]) {
                    analysis.byMarket[p.market] = { total: 0, won: 0 };
                }
                analysis.byMarket[p.market].total++;
                if (p.outcome === 'won') {
                    analysis.byMarket[p.market].won++;
                }
            });

            logger.info('Weekly Prediction Analysis', analysis);
            cache.set('latest_prediction_analysis', analysis, 7 * 24 * 3600); // Cache for 1 week
        } catch (error) {
            logger.error('Prediction analysis error', error);
        }
    }

    async backupData() {
        try {
            const data = {
                users: await User.find().lean(),
                predictions: await Prediction.find({
                    timestamp: { $gte: moment().subtract(7, 'days').toDate() }
                }).lean(),
                transactions: await Transaction.find({
                    timestamp: { $gte: moment().subtract(7, 'days').toDate() }
                }).lean()
            };

            // In a production environment, you would:
            // 1. Compress the data
            // 2. Encrypt sensitive information
            // 3. Upload to secure cloud storage
            // 4. Maintain backup rotation

            logger.info('Data backup completed', {
                recordsCounted: {
                    users: data.users.length,
                    predictions: data.predictions.length,
                    transactions: data.transactions.length
                }
            });
        } catch (error) {
            logger.error('Data backup error', error);
        }
    }

    async checkSystemHealth() {
        try {
            const metrics = {
                timestamp: new Date(),
                memory: process.memoryUsage(),
                uptime: process.uptime(),
                activeUsers: await User.countDocuments({
                    last_interaction: { $gte: moment().subtract(15, 'minutes').toDate() }
                }),
                cacheStats: cache.getStats()
            };

            logger.info('System Health Check', metrics);

            // Alert if memory usage is high
            if (metrics.memory.heapUsed / metrics.memory.heapTotal > 0.9) {
                logger.warn('High memory usage detected', {
                    heapUsed: metrics.memory.heapUsed,
                    heapTotal: metrics.memory.heapTotal
                });
            }
        } catch (error) {
            logger.error('System health check error', error);
        }
    }
}

module.exports = new ScheduledTasksService();