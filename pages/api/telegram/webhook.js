import axios from 'axios';
import { OpenAI } from 'openai';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('[WEBHOOK] Received update:', JSON.stringify(req.body, null, 2));

  if (!req.body || !req.body.message) {
    return res.status(200).json({ status: 'ok' });
  }

  try {
    await processCommand(req.body.message);
    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('[WEBHOOK] Error:', error);
    return res.status(200).json({ status: 'ok' });
  }
}