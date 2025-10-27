// Import monitoring config
const monitoringConfig = {
  canaryGroups: {
    initial: ['test-org-1', 'test-org-2'],
    wave1: ['client1', 'client2', 'client3'],
    wave2: ['client4', 'client5', 'client6'],
    wave3: ['client7', 'client8', 'client9', 'client10'],
  },
};

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Debug environment
  const envDebug = {
    hasApiKey: !!process.env.ADMIN_API_KEY,
    receivedKey: req.headers['x-api-key'],
    keyLength: process.env.ADMIN_API_KEY ? process.env.ADMIN_API_KEY.length : 0,
  };

  // Verify API key
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(403).json({
      error: 'Invalid API key',
      debug: envDebug,
    });
  }

  // Only GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get deployment status
    const deploymentStatus = {
      currentPhase: 'wave1',
      startTime: new Date().toISOString(),
      metrics: {
        errorRate: 0.002, // 0.2% error rate
        p95LatencyMs: 850, // 850ms p95 latency
        quotaUsage: 0.35, // 35% quota usage
      },
      activeGroups: [
        ...monitoringConfig.canaryGroups.initial,
        ...monitoringConfig.canaryGroups.wave1,
      ],
      healthStatus: 'healthy',
      nextPhase: {
        name: 'wave2',
        scheduledStart: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      },
    };

    return res.status(200).json(deploymentStatus);
  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
