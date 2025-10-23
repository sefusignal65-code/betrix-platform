export default async function handler(req, res) {
  // Log incoming request (sanitized)
  console.log('Received request:', {
    method: req.method,
    export const config = {
      runtime: 'edge',
      regions: ['iad1']  // US East (N. Virginia)
    };

    export default async function handler(req) {
      // Handle OPTIONS request for CORS
      if (req.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
            'Access-Control-Max-Age': '86400'
          }
        });
      }

    hasApiKey: !!req.headers['x-api-key'],
    body: {
      model: req.body?.model,
        url: req.url,
        hasApiKey: !!req.headers.get('x-api-key')
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }), 
          { 
            status: 405,
            headers: { 'Content-Type': 'application/json' }
          }
        );
    if (req.headers['x-api-key'] !== process.env.ADMIN_API_KEY) {
      return res.status(403).json({ error: 'Forbidden' });
    }
        const body = await req.json();


        if (req.headers.get('x-api-key') !== process.env.ADMIN_API_KEY) {

          return new Response(
            JSON.stringify({ error: 'Forbidden' }), 
            { 
              status: 403,
              headers: { 'Content-Type': 'application/json' }
            }
          );
    if (!model) {
      return res.status(400).json({ error: 'Model parameter is required' });
        const { model, clients, canaryCount = 2, apply = false } = body;

    // Parse client list or generate random subset
    const clientList = clients
      ? clients.split(',').map(c => c.trim())
          return new Response(
            JSON.stringify({ error: 'Model parameter is required' }), 
            { 
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            }
          );

    // Validate we have clients to process
    if (!clientList?.length) {
      return res.status(400).json({ 
        error: 'No clients specified and could not generate random client list'
      });
    }

    // Track changes for response
    const changes = [];
          return new Response(
            JSON.stringify({ 
              error: 'No clients specified and could not generate random client list' 
            }), 
            { 
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            }
          );
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
        return new Response(
          JSON.stringify({
            success: true,
            dryRun: !apply,
            changes,
            errors: errors.length ? errors : undefined,
            timestamp: new Date().toISOString()
          }), 
          { 
            status: 200,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        );
  // TODO: Replace with actual API call
  const endpoint = `${process.env.ADMIN_API_BASE}/clients/${clientId}/models`;
  
        return new Response(
          JSON.stringify({ 
            error: 'Internal server error',
            message: err.message 
          }), 
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
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