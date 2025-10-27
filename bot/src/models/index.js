const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    telegram_id: { type: Number, required: true, unique: true },
    username: String,
    first_name: String,
    subscription_level: { type: String, enum: ['free', 'premium', 'vip'], default: 'free' },
    joined_date: { type: Date, default: Date.now },
    last_interaction: Date,
    interaction_count: { type: Number, default: 0 },
    successful_predictions: { type: Number, default: 0 },
    total_predictions: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    preferences: {
        notification_frequency: { type: String, enum: ['off', 'daily', 'realtime'], default: 'daily' },
        preferred_markets: [String],
        risk_level: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
        language: { type: String, default: 'en' }
    },
    api_key: String,
    is_banned: { type: Boolean, default: false },
    ban_reason: String,
    referral_code: String,
    referred_by: String,
    referral_count: { type: Number, default: 0 }
});

const InteractionSchema = new mongoose.Schema({
    user_id: Number,
    command: String,
    message: String,
    response: String,
    success: Boolean,
    error: String,
    timestamp: { type: Date, default: Date.now },
    context: Object
});

const PredictionSchema = new mongoose.Schema({
    user_id: Number,
    market: String,
    event: String,
    prediction: String,
    confidence: Number,
    stake_amount: Number,
    potential_return: Number,
    outcome: { type: String, enum: ['pending', 'won', 'lost', 'void'] },
    timestamp: { type: Date, default: Date.now },
    analysis_factors: [String],
    ai_version: String
});

const TransactionSchema = new mongoose.Schema({
    user_id: Number,
    type: { type: String, enum: ['deposit', 'withdrawal', 'bet', 'win', 'loss', 'bonus'] },
    amount: Number,
    currency: { type: String, default: 'USD' },
    status: { type: String, enum: ['pending', 'completed', 'failed'] },
    timestamp: { type: Date, default: Date.now },
    reference: String
});

const MarketSchema = new mongoose.Schema({
    name: String,
    type: String,
    odds: Number,
    status: { type: String, enum: ['active', 'suspended', 'closed'] },
    start_time: Date,
    end_time: Date,
    participants: [String],
    prediction_count: { type: Number, default: 0 },
    success_rate: { type: Number, default: 0 }
});

const User = mongoose.model('User', UserSchema);
const Interaction = mongoose.model('Interaction', InteractionSchema);
const Prediction = mongoose.model('Prediction', PredictionSchema);
const Transaction = mongoose.model('Transaction', TransactionSchema);
const Market = mongoose.model('Market', MarketSchema);

module.exports = {
    User,
    Interaction,
    Prediction,
    Transaction,
    Market
};