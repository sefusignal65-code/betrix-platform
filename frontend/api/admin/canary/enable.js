const sleep = ms => new Promise(r => setTimeout(r, ms));

function validateApiKey(req) {
  const apiKeyHeader = req.headers['x-api-key'] || 
                      req.headers['X-API-Key'] || 
                      req.headers['X-Api-Key'];
  const expectedKey = process.env.ADMIN_API_KEY;
  
  // Debug log (temporary)
  // Debug info available in debug mode only
  if (process.env.DEBUG) {
    const debug = {
      received: apiKeyHeader,
      expected: expectedKey,
      envKeys: Object.keys(process.env),
      matches: apiKeyHeader === expectedKey
    };
    // eslint-disable-next-line no-console
    console.debug('API Key debug:', debug);
  }
  
  return apiKeyHeader === expectedKey;
}

async function getRawBody(req) {
  return await new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

async function generateRandomClients(count) {
  // TODO: replace with a real client list fetch
  const allClients = [
    'client1','client2','client3','client4','client5',
    'client6','client7','client8','client9','client10'
  ];
  return allClients.sort(() => Math.random() - 0.5).slice(0, Math.max(0, count));
}

async function enableModelForClient(clientId, model) {
  const endpoint = `${process.env.ADMIN_API_BASE}/clients/${encodeURIComponent(clientId)}/models`;
  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.ADMIN_API_KEY}`
    },
    body: JSON.stringify({ model, enabled: true })
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Enable failed (${resp.status}): ${text || resp.statusText}`);
  }
  return resp.json();
}

export default async function handler(req, res) {
  // Add CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Verify API key
  if (!validateApiKey(req)) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  // Only POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // API key
  const apiKey = req.headers['x-api-key'] || req.headers['X-API-Key'] || req.headers['X-Api-Key'];
  if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
    console.warn('Forbidden - invalid API key');
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Parse body (handle raw requests)
  let body = req.body;
  if (!body || Object.keys(body).length === 0) {
    try {
      const raw = await getRawBody(req);
      body = raw ? JSON.parse(raw) : {};
    } catch (err) {
      console.warn('Failed to parse body', err.message);
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
  }

  const { model, clients, canaryCount = 2, apply = false } = body || {};
  if (!model) return res.status(400).json({ error: 'Model parameter is required' });
  if (model !== 'claude-sonnet-3.5') return res.status(400).json({ error: 'Invalid model. Only claude-sonnet-3.5 is supported.' });

  const clientList = clients ? String(clients).split(',').map(c => c.trim()).filter(Boolean) : [];
  const selected = clientList.length ? clientList : (await generateRandomClients(canaryCount));
  if (!selected.length) return res.status(400).json({ error: 'No clients to process' });

  const changes = [];
  const errors = [];

  for (const clientId of selected) {
    try {
      if (!apply) {
        changes.push({ clientId, model, status: 'would_enable', dryRun: true });
        continue;
      }
      // Log operations in debug mode
      if (process.env.DEBUG) {
        // eslint-disable-next-line no-console
        console.debug('Enabling model for', clientId);
      }
      await enableModelForClient(clientId, model);
      changes.push({ clientId, model, status: 'enabled', timestamp: new Date().toISOString() });
      await sleep(500);
    } catch (err) {
      console.error('Error enabling for', clientId, err.message);
      errors.push({ clientId, error: err.message });
    }
  }

  return res.status(200).json({ success: true, dryRun: !apply, changes, errors: errors.length ? errors : undefined, timestamp: new Date().toISOString() });
}
