const { MemoryCache } = require('./cache.service');
const logger = require('./logging.service');

class RateLimitService {
    constructor() {
        this.cache = new MemoryCache({ ttl: 60 }); // 1 minute TTL
        this.limits = {
            webhook: {
                window: 60 * 1000, // 1 minute in ms
                maxRequests: 30    // max 30 requests per minute per IP
            },
            chat: {
                window: 60 * 1000,
                maxRequests: 10    // max 10 messages per minute per chat
            }
        };
    }

    async checkLimit(type, identifier) {
        const key = `${type}:${identifier}`;
        const current = await this.cache.get(key) || 0;
        const limit = this.limits[type];

        if (!limit) {
            logger.warn(`Unknown rate limit type: ${type}`);
            return true; // Allow if limit type unknown
        }

        if (current >= limit.maxRequests) {
            logger.warn(`Rate limit exceeded for ${type}:${identifier}`);
            return false;
        }

        await this.cache.set(key, current + 1);
        return true;
    }

    async recordActivity(type, identifier, metadata = {}) {
        const now = Date.now();
        const key = `activity:${type}:${identifier}`;
        
        try {
            const current = await this.cache.get(key) || [];
            current.push({ timestamp: now, ...metadata });
            
            // Keep last 100 activities only
            if (current.length > 100) {
                current.shift();
            }
            
            await this.cache.set(key, current);
        } catch (error) {
            logger.error('Failed to record activity:', error);
        }
    }
}

module.exports = new RateLimitService();