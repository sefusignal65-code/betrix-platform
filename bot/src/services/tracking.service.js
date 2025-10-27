const mongoose = require('mongoose');
const moment = require('moment');

// Click tracking schema
const ClickSchema = new mongoose.Schema({
    source: { type: String, required: true }, // website, referral, direct
    userId: { type: String },
    timestamp: { type: Date, default: Date.now },
    path: String,
    userAgent: String,
    ip: String,
    referrer: String,
    campaign: String
});

// User attribution schema
const AttributionSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    firstClick: {
        source: String,
        timestamp: Date,
        campaign: String
    },
    lastClick: {
        source: String,
        timestamp: Date,
        campaign: String
    },
    conversionData: {
        subscribed: Boolean,
        subscriptionType: String,
        conversionTimestamp: Date,
        conversionValue: Number
    }
});

// Create models
const Click = mongoose.model('Click', ClickSchema);
const Attribution = mongoose.model('Attribution', AttributionSchema);

class TrackingService {
    async trackClick(data) {
        try {
            // Create click record
            const click = await Click.create({
                source: data.source,
                userId: data.userId,
                path: data.path,
                userAgent: data.userAgent,
                ip: data.ip,
                referrer: data.referrer,
                campaign: data.campaign
            });

            // Update attribution
            if (data.userId) {
                const attribution = await Attribution.findOne({ userId: data.userId });
                
                if (!attribution) {
                    // First time user
                    await Attribution.create({
                        userId: data.userId,
                        firstClick: {
                            source: data.source,
                            timestamp: new Date(),
                            campaign: data.campaign
                        },
                        lastClick: {
                            source: data.source,
                            timestamp: new Date(),
                            campaign: data.campaign
                        }
                    });
                } else {
                    // Update last click
                    attribution.lastClick = {
                        source: data.source,
                        timestamp: new Date(),
                        campaign: data.campaign
                    };
                    await attribution.save();
                }
            }

            return click;
        } catch (error) {
            console.error('Tracking error:', error);
            throw error;
        }
    }

    async recordConversion(userId, conversionData) {
        try {
            const attribution = await Attribution.findOne({ userId });
            
            if (attribution) {
                attribution.conversionData = {
                    ...conversionData,
                    conversionTimestamp: new Date()
                };
                await attribution.save();
            }

            return attribution;
        } catch (error) {
            console.error('Conversion tracking error:', error);
            throw error;
        }
    }

    async getAttributionReport(timeframe = '7d') {
        try {
            const startDate = moment().subtract(
                parseInt(timeframe),
                timeframe.endsWith('d') ? 'days' : 'months'
            ).toDate();

            const clicks = await Click.find({
                timestamp: { $gte: startDate }
            });

            const attributions = await Attribution.find({
                'conversionData.conversionTimestamp': { $gte: startDate }
            });

            // Aggregate data
            const report = {
                totalClicks: clicks.length,
                clicksBySource: {},
                conversionsBySource: {},
                totalConversions: attributions.length,
                conversionRate: 0,
                averageConversionValue: 0
            };

            // Process clicks
            clicks.forEach(click => {
                report.clicksBySource[click.source] = (report.clicksBySource[click.source] || 0) + 1;
            });

            // Process conversions
            let totalValue = 0;
            attributions.forEach(attr => {
                if (attr.firstClick && attr.conversionData) {
                    const source = attr.firstClick.source;
                    report.conversionsBySource[source] = (report.conversionsBySource[source] || 0) + 1;
                    totalValue += attr.conversionData.conversionValue || 0;
                }
            });

            // Calculate rates
            report.conversionRate = (report.totalConversions / report.totalClicks * 100).toFixed(2);
            report.averageConversionValue = (totalValue / report.totalConversions).toFixed(2);

            return report;
        } catch (error) {
            console.error('Report generation error:', error);
            throw error;
        }
    }
}

module.exports = new TrackingService();