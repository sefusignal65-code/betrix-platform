const aiService = require('../services/ai.service');
const { User, Interaction } = require('../models');

describe('AI Service', () => {
    let testUser;

    beforeEach(async () => {
        testUser = await User.create({
            telegram_id: 123456789,
            username: 'testuser',
            first_name: 'Test',
            subscription_level: 'premium'
        });
    });

    describe('generateResponse', () => {
        it('should generate a response for user message', async () => {
            const message = 'What is the best betting strategy?';
            const response = await aiService.generateResponse(message, testUser.telegram_id);
            
            expect(response).toBeDefined();
            expect(typeof response).toBe('string');
            expect(response.length).toBeGreaterThan(0);
        });

        it('should include context from recent interactions', async () => {
            // Create some previous interactions
            await Interaction.create({
                user_id: testUser.telegram_id,
                command: '/analyze',
                message: 'Previous analysis request',
                timestamp: new Date()
            });

            const message = 'Continue with the analysis';
            const response = await aiService.generateResponse(message, testUser.telegram_id);
            
            expect(response).toBeDefined();
            expect(response).toMatch(/analysis|previous/i);
        });
    });

    describe('analyzeBettingOpportunity', () => {
        it('should analyze a betting opportunity', async () => {
            const market = 'Premier League';
            const params = {
                team1: 'Manchester City',
                team2: 'Liverpool',
                odds: { home: 1.8, draw: 3.5, away: 4.2 }
            };

            const analysis = await aiService.analyzeBettingOpportunity(market, params);
            
            expect(analysis).toHaveProperty('analysis');
            expect(analysis).toHaveProperty('confidence');
            expect(analysis).toHaveProperty('timestamp');
            expect(analysis.confidence).toBeGreaterThanOrEqual(0.5);
            expect(analysis.confidence).toBeLessThanOrEqual(0.95);
        });
    });

    describe('calculateConfidence', () => {
        it('should calculate confidence based on analysis text', () => {
            const strongAnalysis = 'This is a strong prediction with high probability of success';
            const weakAnalysis = 'This prediction is uncertain and risky';
            
            const strongConfidence = aiService.calculateConfidence(strongAnalysis);
            const weakConfidence = aiService.calculateConfidence(weakAnalysis);
            
            expect(strongConfidence).toBeGreaterThan(weakConfidence);
            expect(strongConfidence).toBeLessThanOrEqual(0.95);
            expect(weakConfidence).toBeGreaterThanOrEqual(0.5);
        });
    });

    describe('learnFromInteraction', () => {
        it('should store interaction with pattern recognition', async () => {
            const interaction = {
                user_id: testUser.telegram_id,
                message: 'What are the odds for Manchester City vs Liverpool?',
                timestamp: new Date()
            };

            const result = await aiService.learnFromInteraction(interaction);
            expect(result).toBe(true);

            const storedInteraction = await Interaction.findOne({ user_id: testUser.telegram_id });
            expect(storedInteraction).toBeDefined();
            expect(storedInteraction.context).toHaveProperty('pattern');
            expect(storedInteraction.context.pattern).toHaveProperty('question', true);
        });
    });
});