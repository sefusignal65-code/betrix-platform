import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, userId, data } = req.body;

  try {
    const BOT_API_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

    switch (action) {
      case 'start_bot':
        // Redirect user to bot with deep linking (use BOT_START_PARAM if configured)
        return res.status(200).json({
          redirect_url: `https://t.me/${process.env.BOT_USERNAME}?start=${process.env.BOT_START_PARAM || `web_${userId}`}`,
        });

      case 'check_subscription':
        // Check if user is subscribed to the channel
        const chatMember = await axios.get(`${BOT_API_URL}/getChatMember`, {
          params: {
            chat_id: `@${process.env.CHANNEL_USERNAME}`,
            user_id: userId,
          },
        });

        return res.status(200).json({
          is_subscribed: ['creator', 'administrator', 'member'].includes(
            chatMember.data.result.status
          ),
        });

      case 'send_prediction':
        // Send prediction to user via bot
        await axios.post(`${BOT_API_URL}/sendMessage`, {
          chat_id: userId,
          text: `🎯 New AI Prediction:\n\n${data.prediction}\n\nConfidence: ${data.confidence}%\nMarket: ${data.market}`,
          parse_mode: 'HTML',
        });

        return res.status(200).json({ success: true });

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Bot API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
