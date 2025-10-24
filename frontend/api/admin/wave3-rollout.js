// Wave 3 (Final Wave) Rollout Script
const WAVE_3_CONFIG = {
  stages: [
    {
      clients: ['client7', 'client8'],
      delay: 0 // immediate
    },
    {
      clients: ['client9'],
      delay: 1800000 // 30 minutes
    },
    {
      clients: ['client10'],
      delay: 3600000 // 1 hour
    }
  ],
  rollbackThresholds: {
    errorRate: 0.05, // 5%
    latencyP95Ms: 5000, // 5 seconds
    quotaUsage: 0.90 // 90%
  }
};

async function validateMetrics() {
  const response = await fetch('/api/admin/status', {
    headers: {
      'X-API-Key': process.env.ADMIN_API_KEY
    }
  });
  const status = await response.json();
  
  return {
    isHealthy: 
      status.metrics.errorRate < WAVE_3_CONFIG.rollbackThresholds.errorRate &&
      status.metrics.p95LatencyMs < WAVE_3_CONFIG.rollbackThresholds.latencyP95Ms &&
      status.metrics.quotaUsage < WAVE_3_CONFIG.rollbackThresholds.quotaUsage,
    metrics: status.metrics
  };
}

async function activateClients(clients) {
  const response = await fetch('/api/admin/canary/enable', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.ADMIN_API_KEY
    },
    body: JSON.stringify({
      client_ids: clients,
      feature: 'sonnet-3-5',
      model: 'claude-sonnet-3.5',
      dryRun: false
    })
  });
  
  return response.json();
}

export async function executeWave3Rollout() {
  console.log('Starting Wave 3 (Final Wave) rollout...');
  
  for (const stage of WAVE_3_CONFIG.stages) {
    // Wait for configured delay
    if (stage.delay > 0) {
      console.log(`Waiting ${stage.delay/60000} minutes before next activation...`);
      await new Promise(resolve => setTimeout(resolve, stage.delay));
    }
    
    // Validate metrics before proceeding
    const health = await validateMetrics();
    if (!health.isHealthy) {
      throw new Error(`Unhealthy metrics detected: ${JSON.stringify(health.metrics)}`);
    }
    
    // Activate this stage's clients
    console.log(`Activating clients: ${stage.clients.join(', ')}`);
    await activateClients(stage.clients);
    
    // Wait 5 minutes and check health
    await new Promise(resolve => setTimeout(resolve, 300000));
    const postActivationHealth = await validateMetrics();
    if (!postActivationHealth.isHealthy) {
      throw new Error(`Post-activation health check failed: ${JSON.stringify(postActivationHealth.metrics)}`);
    }
  }
  
  console.log('Wave 3 rollout completed successfully');
  return true;
}