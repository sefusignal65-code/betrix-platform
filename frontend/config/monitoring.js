export const monitoringConfig = {
  // Monitoring intervals in milliseconds
  intervals: {
    usage: 300000, // Check usage every 5 minutes
    errors: 60000, // Check errors every minute
    latency: 30000, // Check latency every 30 seconds
  },

  // Alert thresholds
  thresholds: {
    errorRate: 0.01, // Alert if error rate exceeds 1%
    latencyMs: 2000, // Alert if p95 latency exceeds 2000ms
    quotaUsage: 0.8, // Alert if quota usage exceeds 80%
  },

  // Canary groups for monitoring
  canaryGroups: {
    initial: ['test-org-1', 'test-org-2'],
    wave1: ['client1', 'client2', 'client3'],
    wave2: ['client4', 'client5', 'client6'],
    wave3: ['client7', 'client8', 'client9', 'client10'],
  },

  // Rollback triggers
  rollbackTriggers: {
    errorThreshold: 0.05, // 5% error rate
    latencyThreshold: 5000, // 5 second p95 latency
    consecutiveFailures: 3, // Number of consecutive check failures before rollback
  },
};
