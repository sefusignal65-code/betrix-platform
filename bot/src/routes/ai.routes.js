const express = require('express');
const AIService = require('../services/ai.service');
const logging = require('../services/logging.service');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// Middleware to track API usage
const trackUsage = async (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logging.logPerformance('ai_api', duration, {
            endpoint: req.path,
            userId: req.user?.id,
            status: res.statusCode
        });
    });
    next();
};

router.use(authenticate);
router.use(trackUsage);

// Chat endpoint
router.post('/chat', async (req, res) => {
    try {
        const { message, type = 'predict' } = req.body;
        const userId = req.user.id;

        if (!message) {
            return res.status(400).json({
                error: 'Message is required'
            });
        }

        const response = await AIService.generateResponse(message, userId, { type });
        
        return res.json({
            success: true,
            response
        });
    } catch (error) {
        logging.error('Chat endpoint error', error);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// Streaming chat endpoint
router.post('/chat/stream', async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.user.id;

        if (!message) {
            return res.status(400).json({
                error: 'Message is required'
            });
        }

        // Set headers for SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Stream response
        await AIService.streamResponse(message, userId, (chunk) => {
            res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
        });

        res.end();
    } catch (error) {
        logging.error('Stream chat endpoint error', error);
        res.write(`data: ${JSON.stringify({ error: 'Stream ended unexpectedly' })}\n\n`);
        res.end();
    }
});

// Match prediction endpoint
router.post('/predict', async (req, res) => {
    try {
        const { match } = req.body;
        const userId = req.user.id;

        if (!match) {
            return res.status(400).json({
                error: 'Match details are required'
            });
        }

        const response = await AIService.analyzeBettingOpportunity(match, {
            userId,
            type: 'predict'
        });

        return res.json({
            success: true,
            ...response
        });
    } catch (error) {
        logging.error('Prediction endpoint error', error);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// Get user context endpoint
router.get('/context', async (req, res) => {
    try {
        const userId = req.user.id;
        const context = await AIService.getContext(userId);

        return res.json({
            success: true,
            context: context.map(({ content, role, timestamp }) => ({
                content,
                role,
                timestamp
            }))
        });
    } catch (error) {
        logging.error('Context endpoint error', error);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// Clear user context endpoint
router.delete('/context', async (req, res) => {
    try {
        const userId = req.user.id;
        await AIService.clearContext(userId);

        return res.json({
            success: true,
            message: 'Context cleared successfully'
        });
    } catch (error) {
        logging.error('Clear context endpoint error', error);
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
});

module.exports = router;