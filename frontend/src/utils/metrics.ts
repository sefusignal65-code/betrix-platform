import { MetricsConfig, Metrics, HealthCheckResult } from './types';

const DEFAULT_THRESHOLDS: MetricsConfig = {
  errorRate: {
    critical: 0.05, // 5%
    warning: 0.02, // 2%
  },
  latencyMs: {
    p95: {
      critical: 2000, // 2 seconds
      warning: 1000, // 1 second
    },
    p99: {
      critical: 5000, // 5 seconds
      warning: 2000, // 2 seconds
    },
  },
  quotaUsage: {
    critical: 0.9, // 90%
    warning: 0.75, // 75%
  },
};

export async function validateMetrics(
  metrics: Metrics,
  config: MetricsConfig = DEFAULT_THRESHOLDS
): Promise<HealthCheckResult> {
  const result = {
    isHealthy: true,
    warnings: [] as string[],
    errors: [] as string[],
  };

  // Error Rate Check
  if (metrics.errorRate >= config.errorRate.critical) {
    result.isHealthy = false;
    result.errors.push(
      `Error rate (${metrics.errorRate}) exceeds critical threshold (${config.errorRate.critical})`
    );
  } else if (metrics.errorRate >= config.errorRate.warning) {
    result.warnings.push(
      `Error rate (${metrics.errorRate}) exceeds warning threshold (${config.errorRate.warning})`
    );
  }

  // Latency Check
  if (metrics.latencyMs.p95 >= config.latencyMs.p95.critical) {
    result.isHealthy = false;
    result.errors.push(
      `P95 latency (${metrics.latencyMs.p95}ms) exceeds critical threshold (${config.latencyMs.p95.critical}ms)`
    );
  } else if (metrics.latencyMs.p95 >= config.latencyMs.p95.warning) {
    result.warnings.push(
      `P95 latency (${metrics.latencyMs.p95}ms) exceeds warning threshold (${config.latencyMs.p95.warning}ms)`
    );
  }

  // Quota Usage Check
  if (metrics.quotaUsage >= config.quotaUsage.critical) {
    result.isHealthy = false;
    result.errors.push(
      `Quota usage (${metrics.quotaUsage * 100}%) exceeds critical threshold (${config.quotaUsage.critical * 100}%)`
    );
  } else if (metrics.quotaUsage >= config.quotaUsage.warning) {
    result.warnings.push(
      `Quota usage (${metrics.quotaUsage * 100}%) exceeds warning threshold (${config.quotaUsage.warning * 100}%)`
    );
  }

  return result;
}

export function aggregateMetrics(metrics: Metrics[]): Metrics {
  return {
    errorRate: metrics.reduce((acc, m) => acc + m.errorRate, 0) / metrics.length,
    latencyMs: {
      p95: Math.max(...metrics.map((m) => m.latencyMs.p95)),
      p99: Math.max(...metrics.map((m) => m.latencyMs.p99)),
    },
    quotaUsage: Math.max(...metrics.map((m) => m.quotaUsage)),
  };
}
