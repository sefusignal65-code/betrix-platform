const jwt = require('jsonwebtoken');
const logging = require('../services/logging.service');

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Authentication required'
            });
        }

        const token = authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                error: 'Token required'
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = {
                id: decoded.userId,
                role: decoded.role
            };
            
            logging.debug('User authenticated', {
                userId: decoded.userId,
                role: decoded.role
            });

            next();
        } catch (error) {
            logging.error('Token verification failed', error);
            return res.status(401).json({
                error: 'Invalid token'
            });
        }
    } catch (error) {
        logging.error('Authentication error', error);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
};

// Special middleware for bot-to-bot communication
const authenticateBot = async (req, res, next) => {
    try {
        const token = req.headers['x-bot-token'];
        
        if (!token || token !== process.env.BOT_API_TOKEN) {
            return res.status(401).json({
                error: 'Invalid bot token'
            });
        }

        req.user = {
            id: 'bot',
            role: 'bot'
        };

        next();
    } catch (error) {
        logging.error('Bot authentication error', error);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
};

module.exports = {
    authenticate,
    authenticateBot
};