const winston = require('winston');
const moment = require('moment');

class LoggingService {
    constructor() {
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
                new winston.transports.File({ filename: 'logs/combined.log' })
            ]
        });

        // Add console transport in development
        if (process.env.NODE_ENV !== 'production') {
            this.logger.add(new winston.transports.Console({
                format: winston.format.simple()
            }));
        }
    }

    info(message, metadata = {}) {
        this.logger.info(message, { ...metadata, timestamp: moment().format() });
    }

    error(message, error = null, metadata = {}) {
        this.logger.error(message, {
            ...metadata,
            error: error?.stack || error?.message || error,
            timestamp: moment().format()
        });
    }

    warn(message, metadata = {}) {
        this.logger.warn(message, { ...metadata, timestamp: moment().format() });
    }

    debug(message, metadata = {}) {
        this.logger.debug(message, { ...metadata, timestamp: moment().format() });
    }

    // System monitoring
    logSystemMetrics(metrics) {
        this.info('System Metrics', {
            type: 'metrics',
            ...metrics
        });
    }

    // User activity monitoring
    logUserActivity(userId, action, details = {}) {
        this.info('User Activity', {
            type: 'user_activity',
            userId,
            action,
            ...details
        });
    }

    // Performance monitoring
    logPerformance(operation, duration, metadata = {}) {
        this.info('Performance Metric', {
            type: 'performance',
            operation,
            duration,
            ...metadata
        });
    }

    // AI operation monitoring
    logAIOperation(operation, result, metadata = {}) {
        this.info('AI Operation', {
            type: 'ai_operation',
            operation,
            result,
            ...metadata
        });
    }
}

module.exports = new LoggingService();