const axios = require('axios');
const { OpenAI } = require('openai');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN environment variable is not set');
}

// Initialize OpenAI for direct usage
const OPENAI_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is not set');
}

const openai = new OpenAI({
  apiKey: OPENAI_KEY,
});

// Telegram API helpers
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function sendTelegramMessage(chatId, text, parseMode = 'Markdown') {
  console.log('Sending Telegram message:', {
    chatId,
    text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
    parseMode,
  });

  try {
    const response = await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: parseMode,
    });

    console.log('Telegram API response:', response.data);

    if (!response.data.ok) {
      throw new Error(`Telegram API error: ${response.data.description}`);
    }

    return response.data;
  } catch (error) {
    console.error('Failed to send Telegram message:', {
      error: error.message,
      response: error.response?.data,
      chatId,
    });
    throw error;
  }
}

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
    console.error('AI generation error:', error);
    return '⚠️ AI service temporarily unavailable. Please try again later.';
  }
}

async function processCommand(message) {
  if (!message || !message.chat) {
    console.error('Invalid message format:', message);
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
    console.error('Command processing error:', error);
    await sendTelegramMessage(chatId, '⚠️ Sorry, I encountered an error. Please try again.');
  }
}

module.exports = async function handler(req, res) {
  // Log all requests for debugging
  console.log('Incoming request:', {
    method: req.method,
    headers: req.headers,
    body: req.body,
  });

  if (req.method === 'POST') {
    try {
      const body = req.body;

      // Validate message format
      if (!body || !body.message || !body.message.chat || !body.message.chat.id) {
        console.error('Invalid message format:', body);
        return res.status(200).json({ ok: true, description: 'Invalid message format' });
      }

      // Process command and await completion
      await processCommand(body.message);
      return res.status(200).json({ ok: true });
    } catch (error) {
      console.error('Webhook processing error:', {
        error: error.message,
        stack: error.stack,
        body: req.body,
      });

      // Always return 200 to Telegram
      return res.status(200).json({
        ok: true,
        description: 'Error handled gracefully',
      });
    }
  }

  // For GET requests (Telegram webhook verification)
  return res.status(200).json({ ok: true });
};
