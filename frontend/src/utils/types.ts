export interface ThresholdConfig {
  critical: number;
  warning: number;
}

export interface LatencyThresholds {
  p95: ThresholdConfig;
  p99: ThresholdConfig;
}

export interface MetricsConfig {
  errorRate: ThresholdConfig;
  latencyMs: LatencyThresholds;
  quotaUsage: ThresholdConfig;
}

export interface Metrics {
  errorRate: number;
  latencyMs: {
    p95: number;
    p99: number;
  };
  quotaUsage: number;
}

export interface HealthCheckResult {
  isHealthy: boolean;
  warnings: string[];
  errors: string[];
  metrics?: Metrics;
}
