const axios = require('axios');
const { OpenAI } = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { body } = req;

    // Ensure we received a valid Telegram update
    if (!body || !body.message) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const {
      message: { chat: { id: chatId }, text },
    } = body;

    // Log incoming message for debugging
    console.log('Received message:', { chatId, text });

    if (!text) {
      return res.status(400).json({ error: 'No message text provided' });
    }

    // Handle /start command
    if (text === '/start') {
      await sendTelegramMessage(
        chatId,
        'Welcome to BETRIX AI! 🎯\n\nI\'m your expert betting analysis assistant. I can help you with:\n\n' +
        '• Match predictions\n' +
        '• Team analysis\n' +
        '• Statistical insights\n\n' +
        'Just send me your question about any upcoming match or team!'
      );
      return res.status(200).json({ ok: true });
    }

    // Generate AI response for all other messages
    const aiResponse = await generateAIResponse(text);
    await sendTelegramMessage(chatId, aiResponse);

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

async function generateAIResponse(query, type = 'predict') {
  try {
    let systemPrompt = 'You are BETRIX AI, an expert betting analysis system.';

    if (type === 'predict') {
      systemPrompt += ' Provide precise, data-driven match predictions with detailed reasoning.';
    } else if (type === 'analyze') {
      systemPrompt += ' Focus on in-depth statistical analysis of teams and players. Consider recent form, head-to-head records, and relevant performance metrics.';
    } else {
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
  if (!message || !message.chat) return;
  const chatId = message.chat.id;
  const text = message.text || '';

  try {
    if (text === '/start') {
      await sendTelegramMessage(chatId, `Welcome to BETRIX AI! 🚀\n\nI'm your AI-powered betting assistant. Use these commands:\n\n- /predict [match] - Get AI prediction\n- /analyze [team/player] - Statistical analysis\n\nSend /help to see all commands.`);
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
      await sendTelegramMessage(chatId, `🤖 *BETRIX AI Commands*\n\n/start - Start the bot\n/predict [match] - Get AI prediction\n/analyze [team/player] - Statistical analysis\n/help - Show this help message`);
      return;
    }
  } catch (error) {
    console.error('Command processing error:', error);
    await sendTelegramMessage(chatId, '⚠️ Sorry, I encountered an error. Please try again.');
  }
}

app.post('/webhook', async (req, res) => {
  console.log('Received update:', JSON.stringify(req.body, null, 2));

  if (!req.body || !req.body.message) {
    return res.status(200).send('OK');
  }

  try {
    await processCommand(req.body.message);
    return res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(200).send('OK');
  }
});

app.get('/webhook', (req, res) => {
  res.status(200).send('Webhook is running');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Webhook server is running on port ${port}`);
});