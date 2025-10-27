const NodeCache = require('node-cache');
const logger = require('./logging.service');

class CacheService {
    constructor() {
        // Initialize cache with standard TTL of 1 hour and check period of 10 minutes
        this.cache = new NodeCache({
            stdTTL: 3600,
            checkperiod: 600
        });

        // Monitor cache statistics
        setInterval(() => this.monitorCacheStats(), 300000); // every 5 minutes
    }

    // Get item from cache
    get(key) {
        try {
            return this.cache.get(key);
        } catch (error) {
            logger.error('Cache get error', error, { key });
            return null;
        }
    }

    // Set item in cache with optional TTL
    set(key, value, ttl = 3600) {
        try {
            return this.cache.set(key, value, ttl);
        } catch (error) {
            logger.error('Cache set error', error, { key });
            return false;
        }
    }

    // Delete item from cache
    delete(key) {
        try {
            return this.cache.del(key);
        } catch (error) {
            logger.error('Cache delete error', error, { key });
            return false;
        }
    }

    // Clear entire cache
    clear() {
        try {
            return this.cache.flushAll();
        } catch (error) {
            logger.error('Cache clear error', error);
            return false;
        }
    }

    // Get multiple items
    getMultiple(keys) {
        try {
            return this.cache.mget(keys);
        } catch (error) {
            logger.error('Cache multiple get error', error, { keys });
            return {};
        }
    }

    // Set multiple items
    setMultiple(keyValuePairs, ttl = 3600) {
        try {
            return this.cache.mset(
                Object.entries(keyValuePairs).map(([key, value]) => ({
                    key,
                    val: value,
                    ttl
                }))
            );
        } catch (error) {
            logger.error('Cache multiple set error', error);
            return false;
        }
    }

    // Check if key exists
    has(key) {
        try {
            return this.cache.has(key);
        } catch (error) {
            logger.error('Cache has error', error, { key });
            return false;
        }
    }

    // Get cache statistics
    getStats() {
        return {
            keys: this.cache.keys(),
            stats: this.cache.getStats(),
            hits: this.cache.getStats().hits,
            misses: this.cache.getStats().misses,
            hitRate: this.calculateHitRate()
        };
    }

    // Calculate cache hit rate
    calculateHitRate() {
        const stats = this.cache.getStats();
        const total = stats.hits + stats.misses;
        return total === 0 ? 0 : (stats.hits / total * 100).toFixed(2);
    }

    // Monitor cache statistics
    monitorCacheStats() {
        const stats = this.getStats();
        logger.info('Cache Statistics', {
            type: 'cache_stats',
            ...stats
        });
    }
}

module.exports = new CacheService();