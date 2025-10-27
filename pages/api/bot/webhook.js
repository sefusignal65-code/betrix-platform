// Next.js API route handler
const axios = require('axios');
const { OpenAI } = require('openai');
const rateLimiter = require('../../bot/src/services/rate-limit.service');

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!OPENAI_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is not set');
}

if (!BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN environment variable is not set');
}

const openai = new OpenAI({
  apiKey: OPENAI_KEY
});

// Telegram API helpers
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function sendTelegramMessage(chatId, text, parseMode = 'Markdown') {
  console.log('Sending Telegram message: - webhook.js:26', {
    chatId,
    text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
    parseMode
  });

  try {
    const response = await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: parseMode
    });

    console.log('Telegram API response: - webhook.js:39', response.data);
    
    if (!response.data.ok) {
      throw new Error(`Telegram API error: ${response.data.description}`);
    }

    return response.data;
  } catch (error) {
    console.error('Failed to send Telegram message: - webhook.js:47', {
      error: error.message,
      response: error.response?.data,
      chatId
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
        systemPrompt += ' Focus on in-depth statistical analysis of teams and players. Consider recent form, head-to-head records, and relevant performance metrics.';
        break;
      default:
        systemPrompt += ' Provide precise, data-driven predictions and analysis.';
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      temperature: 0.7,
      max_tokens: 800
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('AI generation error: - webhook.js:83', error);
    return "⚠️ AI service temporarily unavailable. Please try again later.";
  }
}

async function processCommand(message) {
  if (!message || !message.chat) {
    console.error('Invalid message format: - webhook.js:90', message);
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
    console.error('Command processing error: - webhook.js:137', error);
    await sendTelegramMessage(chatId, '⚠️ Sorry, I encountered an error. Please try again.');
  }
}

export const config = {
  runtime: 'nodejs18.x'
};

export default async function handler(req, res) {
  // Health check endpoint
  if (req.method === 'GET' && req.query.health === 'check') {
    if (req.headers['x-webhook-secret'] !== WEBHOOK_SECRET) {
      return res.status(401).json({ status: 'unauthorized' });
    }
    try {
      const webhookInfo = await axios.get(`${TELEGRAM_API}/getWebhookInfo`);
      return res.json({
        status: 'healthy',
        webhook: webhookInfo.data.result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(500).json({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Rate limit by IP for webhook calls
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  if (!(await rateLimiter.checkLimit('webhook', clientIp))) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  // Strict webhook secret verification in production
  if (process.env.NODE_ENV === 'production') {
    const receivedSecret = req.headers['x-telegram-bot-api-secret-token'];
    const expectedSecret = WEBHOOK_SECRET;

    if (!expectedSecret) {
      console.error('Webhook secret is not set in environment (TELEGRAM_WEBHOOK_SECRET) - webhook.js:180');
      return res.status(500).json({ error: 'Server misconfiguration' });
    }

    if (!receivedSecret || receivedSecret !== expectedSecret) {
      console.warn('Unauthorized webhook call  invalid or missing secret header - webhook.js:185');
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  // Handle Telegram webhook verification
  if (req.method === 'GET') {
    return res.status(200).json({ 
      ok: true,
      description: 'Webhook is active',
      timestamp: new Date().toISOString()
    });
  }

  if (req.method === 'POST') {
    try {
      const body = req.body;

      // Enhanced validation
      if (!body) {
        throw new Error('Empty request body');
      }

      // Handle message and callback_query
      const message = body.message || body.callback_query?.message;
      if (!message?.chat?.id) {
        throw new Error('Invalid message format: Missing chat.id');
      }

      // Rate limit by chat ID
      if (!(await rateLimiter.checkLimit('chat', message.chat.id))) {
        await sendTelegramMessage(
          message.chat.id,
          '⚠️ Rate limit exceeded. Please wait a moment before sending more messages.'
        );
        return res.status(429).json({ error: 'Rate limit exceeded for chat' });
      }

      // Record activity for monitoring
      await rateLimiter.recordActivity('chat', message.chat.id, {
        messageType: message.text?.startsWith('/') ? 'command' : 'message',
        command: message.text?.split(' ')[0],
        userId: message.from?.id
      });

      // Process command using the resolved message object (supports callback_query)
      await processCommand(message);
      return res.status(200).json({ ok: true });
    } catch (error) {
      // Enhanced error logging with activity tracking
      const errorDetails = {
        message: error.message,
        stack: error.stack,
        requestBody: req.body,
        timestamp: new Date().toISOString(),
        url: req.url,
        method: req.method
      };
      
      console.error('Webhook error: - webhook.js:244', JSON.stringify(errorDetails, null, 2));
      
      // Try to notify user if possible
      if (req.body?.message?.chat?.id) {
        try {
          await sendTelegramMessage(
            req.body.message.chat.id,
            '⚠️ Sorry, I encountered an error processing your request. The team has been notified.'
          );
        } catch (notifyError) {
          console.error('Failed to send error notification: - webhook.js:254', notifyError);
        }
      }
      
      // Always return 200 to Telegram
      return res.status(200).json({
        ok: true,
        description: 'Error logged and handled'
      });
    }
  }

  // For GET requests (Telegram webhook verification)
  return res.status(200).json({ ok: true });
}