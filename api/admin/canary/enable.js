export default async function handler(req, res) {
  // Log incoming request (sanitized)
  console.log('Received request:', {
    method: req.method,
    path: req.url,
    hasApiKey: !!req.headers['x-api-key'],
    body: {
      model: req.body?.model,
      canaryCount: req.body?.canaryCount,
      hasClients: !!req.body?.clients,
      apply: !!req.body?.apply
    }
  });

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate API key
    if (req.headers['x-api-key'] !== process.env.ADMIN_API_KEY) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { model, clients, canaryCount = 2, apply = false } = req.body;

    // Validate required model parameter
    if (!model) {
      return res.status(400).json({ error: 'Model parameter is required' });
    }

    // Parse client list or generate random subset
    const clientList = clients
      ? clients.split(',').map(c => c.trim())
      : await generateRandomClients(canaryCount);

    // Validate we have clients to process
    if (!clientList?.length) {
      return res.status(400).json({ 
        error: 'No clients specified and could not generate random client list'
      });
    }

    // Track changes for response
    const changes = [];
    const errors = [];

    // Process each client with rate limiting
    for (const clientId of clientList) {
      try {
        // In dry-run mode, just log what would happen
        if (!apply) {
          changes.push({
            clientId,
            model,
            status: 'would_enable',
            dryRun: true
          });
          continue;
        }

        // Actually enable the model for this client
        const result = await enableModelForClient(clientId, model);
        
        changes.push({
          clientId,
          model,
          status: 'enabled',
          timestamp: new Date().toISOString()
        });

        // Rate limit between requests
        await sleep(1000);

      } catch (err) {
        errors.push({
          clientId,
          error: err.message
        });
      }
    }

    // Return results
    return res.status(200).json({
      success: true,
      dryRun: !apply,
      changes,
      errors: errors.length ? errors : undefined,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Error in canary enable handler:', err);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: err.message 
    });
  }
}

// Helper to generate random subset of clients
async function generateRandomClients(count) {
  // TODO: Replace with actual client list fetch
  const allClients = [
    'client1', 'client2', 'client3', 'client4', 'client5',
    'client6', 'client7', 'client8', 'client9', 'client10'
  ];
  
  // Shuffle and take first n
  return allClients
    .sort(() => Math.random() - 0.5)
    .slice(0, count);
}

// Helper to enable model for a client
async function enableModelForClient(clientId, model) {
  // TODO: Replace with actual API call
  const endpoint = `${process.env.ADMIN_API_BASE}/clients/${clientId}/models`;
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.ADMIN_API_KEY}`
    },
    body: JSON.stringify({
      model,
      enabled: true
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to enable model for client ${clientId}: ${response.statusText}`);
  }

  return response.json();
}

// Simple sleep helper for rate limiting
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}