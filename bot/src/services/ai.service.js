const { OpenAI } = require('openai');
const natural = require('natural');
const { Interaction } = require('../models');
const { MemoryCache } = require('./cache.service');
const { logger } = require('./logging.service');

// Initialize cache for conversation context and rate limiting
const contextCache = new MemoryCache({ ttl: 3600 }); // 1 hour TTL
const rateLimitCache = new MemoryCache({ ttl: 60 }); // 1 minute TTL

class AIService {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        this.tokenizer = new natural.WordTokenizer();
        
        // Rate limiting configuration
        this.rateLimit = {
            maxRequests: 20, // requests per minute
            window: 60000 // 1 minute in ms
        };
    }

    async checkRateLimit(userId) {
        const key = `rate_limit:${userId}`;
        const current = await rateLimitCache.get(key) || 0;
        
        if (current >= this.rateLimit.maxRequests) {
            throw new Error('Rate limit exceeded. Please try again later.');
        }
        
        await rateLimitCache.set(key, current + 1);
    }

    async generateResponse(message, userId, context = {}) {
        try {
            await this.checkRateLimit(userId);
            
            // Get user's recent interactions for context
            const recentInteractions = await Interaction.find({ user_id: userId })
                .sort({ timestamp: -1 })
                .limit(5);

            const conversationHistory = recentInteractions.map(i => ({
                role: i.command ? 'user' : 'assistant',
                content: i.command || i.message
            }));

            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: `You are BETRIX AI, an advanced betting analysis assistant. You help users make informed betting decisions using data analysis and machine learning.
                        
                        Key Capabilities:
                        - Analyze betting markets and opportunities
                        - Provide data-driven predictions
                        - Explain betting strategies
                        - Manage risk and bankroll
                        - Track performance metrics
                        
                        Style Guide:
                        - Be professional but friendly
                        - Use emojis appropriately
                        - Provide clear, actionable advice
                        - Always emphasize responsible betting
                        - Include relevant statistics when available
                        
                        Context: ${JSON.stringify(context)}`
                    },
                    ...conversationHistory,
                    {
                        role: 'user',
                        content: message
                    }
                ],
                max_tokens: 500,
                temperature: 0.7
            });

            return completion.choices[0].message.content;
        } catch (error) {
            console.error('AI response error:', error);
            return 'I apologize, but I\'m having trouble generating a response right now. Please try again in a moment.';
        }
    }

    async analyzeBettingOpportunity(market, params) {
        try {
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: `You are a betting analysis expert. Analyze the given market and parameters.
                        
                        Required Output Format:
                        1. Market Analysis
                        2. Key Factors
                        3. Risk Assessment
                        4. Prediction
                        5. Confidence Level
                        6. Recommended Stake
                        7. Potential Return
                        
                        Consider:
                        - Historical data
                        - Current form
                        - Head-to-head records
                        - Market conditions
                        - External factors`
                    },
                    {
                        role: 'user',
                        content: `Analyze betting opportunity for ${market} with parameters: ${JSON.stringify(params)}`
                    }
                ],
                max_tokens: 1000,
                temperature: 0.5
            });

            return {
                analysis: completion.choices[0].message.content,
                confidence: this.calculateConfidence(completion.choices[0].message.content),
                timestamp: new Date()
            };
        } catch (error) {
            console.error('Analysis error:', error);
            throw new Error('Analysis failed');
        }
    }

    calculateConfidence(analysis) {
        // Extract confidence indicators from analysis
        const positiveIndicators = ['strong', 'certain', 'confident', 'likely', 'high probability'];
        const negativeIndicators = ['uncertain', 'risky', 'unclear', 'difficult', 'unpredictable'];

        const tokens = this.tokenizer.tokenize(analysis.toLowerCase());
        
        let confidence = 0.75; // Base confidence
        
        positiveIndicators.forEach(indicator => {
            if (tokens.includes(indicator)) confidence += 0.05;
        });
        
        negativeIndicators.forEach(indicator => {
            if (tokens.includes(indicator)) confidence -= 0.05;
        });

        return Math.min(Math.max(confidence, 0.5), 0.95);
    }

    async learnFromInteraction(interaction) {
        try {
            const tokens = this.tokenizer.tokenize(interaction.message.toLowerCase());
            
            // Store interaction pattern
            await new Interaction({
                ...interaction,
                context: {
                    tokens,
                    pattern: this.identifyPattern(tokens)
                }
            }).save();

            // Store in context cache for quick retrieval
            const userId = interaction.user_id;
            const userContext = await contextCache.get(userId) || [];
            
            userContext.push({
                role: interaction.command ? 'user' : 'assistant',
                content: interaction.command || interaction.message,
                timestamp: new Date()
            });

            // Keep only last 10 interactions in cache
            if (userContext.length > 10) {
                userContext.shift();
            }

            await contextCache.set(userId, userContext);
            
            logger.info('Interaction learned and cached', {
                userId,
                pattern: this.identifyPattern(tokens)
            });

            return true;
        } catch (error) {
            logger.error('Learning error:', error);
            return false;
        }
    }

    async streamResponse(message, userId, onProgress) {
        try {
            await this.checkRateLimit(userId);
            
            const stream = await this.openai.chat.completions.create({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: 'You are BETRIX AI, providing real-time betting analysis.'
                    },
                    {
                        role: 'user',
                        content: message
                    }
                ],
                stream: true
            });

            let fullResponse = '';
            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';
                fullResponse += content;
                
                if (onProgress && content) {
                    onProgress(content);
                }
            }

            // Learn from the complete interaction
            await this.learnFromInteraction({
                user_id: userId,
                message: fullResponse,
                command: message,
                timestamp: new Date()
            });

            return fullResponse;
        } catch (error) {
            logger.error('Stream response error:', error);
            throw error;
        }
    }

    identifyPattern(tokens) {
        // Pattern recognition logic
        const patterns = {
            question: ['what', 'how', 'why', 'when', 'where', 'which'],
            action: ['analyze', 'predict', 'calculate', 'show', 'give'],
            market: ['football', 'soccer', 'tennis', 'basketball', 'baseball', 'racing'],
            odds: ['odds', 'probability', 'chance', 'likelihood'],
            money: ['stake', 'bet', 'money', 'dollar', 'euro', 'profit']
        };

        const foundPatterns = {};
        
        Object.entries(patterns).forEach(([key, keywords]) => {
            foundPatterns[key] = tokens.some(token => keywords.includes(token));
        });

        return foundPatterns;
    }
}

module.exports = new AIService();