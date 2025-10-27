const axios = require('axios');
const { OpenAI } = require('openai');

// Initialize OpenAI for direct usage (avoid importing from bot package in serverless)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Telegram API helpers
const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

async function sendTelegramMessage(chatId, text, parseMode = 'Markdown') {
  try {
    await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: parseMode,
    });
  } catch (error) {
    console.error('Failed to send Telegram message:', error.response?.data || error.message);
    throw error;
  }
}

// AI response generation (minimal version for serverless)
async function generateAIResponse(query, type = 'predict') {
  try {
    let systemPrompt = 'You are BETRIX AI, an expert betting analysis system.';

    switch (type) {
      case 'predict':
        systemPrompt += ' Provide precise, data-driven match predictions with detailed reasoning.';
        break;
      case 'analyze':
        systemPrompt +=
          ' Focus on in-depth statistical analysis of teams and players. Consider recent form, head-to-head records, and relevant performance metrics.';
        break;
      default:
        systemPrompt += ' Provide precise, data-driven predictions and analysis.';
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('AI generation error: - webhook.js:57', error);
    return '⚠️ AI service temporarily unavailable. Please try again later.';
  }
}

// Process Telegram command
async function processCommand(message) {
  if (!message || !message.chat) {
    console.error('Invalid message format: - webhook.js:65', message);
    return;
  }

  const chatId = message.chat.id;
  const text = message.text || '';

  try {
    if (text === '/start') {
      await sendTelegramMessage(
        chatId,
        `Welcome to BETRIX AI! 🚀\n\nI'm your AI-powered betting assistant. Use these commands:\n\n` +
          `- /predict [match] - Get AI prediction\n` +
          `- /analyze [team/player] - Statistical analysis\n\n` +
          `Send /help to see all commands.`
      );
      return;
    }

    const predictMatch = text.match(/^\/predict\s+(.+)/);
    if (predictMatch) {
      await sendTelegramMessage(chatId, '🔄 Analyzing match data...');
      const prediction = await generateAIResponse(predictMatch[1], 'predict');
      await sendTelegramMessage(chatId, `🎯 *Match Prediction*\n\n${prediction}`);
      return;
    }

    const analyzeMatch = text.match(/^\/analyze\s+(.+)/);
    if (analyzeMatch) {
      await sendTelegramMessage(chatId, '📊 Gathering statistical data...');
      const analysis = await generateAIResponse(analyzeMatch[1], 'analyze');
      await sendTelegramMessage(chatId, `📈 *Statistical Analysis*\n\n${analysis}`);
      return;
    }

    if (text === '/help') {
      await sendTelegramMessage(
        chatId,
        `🤖 *BETRIX AI Commands*\n\n` +
          `/start - Start the bot\n` +
          `/predict [match] - Get AI prediction\n` +
          `/analyze [team/player] - Statistical analysis\n` +
          `/help - Show this help message`
      );
      return;
    }
  } catch (error) {
    console.error('Command processing error: - webhook.js:112', error);
    await sendTelegramMessage(chatId, '⚠️ Sorry, I encountered an error. Please try again.');
  }
}

// Webhook handler
module.exports = async function handler(req, res) {
  // Log incoming update
  console.log('Received update: - webhook.js:120', JSON.stringify(req.body, null, 2));

  if (req.method !== 'POST') {
    return res.status(200).send('OK');
  }

  if (!req.body || !req.body.message) {
    console.error('Invalid update format: - webhook.js:127', req.body);
    return res.status(200).send('OK');
  }

  try {
    await processCommand(req.body.message);
    return res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error: - webhook.js:135', error);
    return res.status(200).send('OK'); // Always return 200 to Telegram
  }
};
