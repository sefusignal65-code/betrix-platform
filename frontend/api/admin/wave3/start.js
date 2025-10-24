import { executeWave3Rollout } from './wave3-rollout';

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Verify API key
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  // Only POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await executeWave3Rollout();
    return res.status(200).json({ 
      message: 'Wave 3 rollout initiated successfully',
      status: 'running',
      startTime: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({ 
      error: 'Wave 3 rollout failed to start',
      message: error.message 
    });
  }
}