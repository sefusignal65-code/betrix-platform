import { metrics, MetricAttributes } from '@opentelemetry/api';
import { PrometheusExporter, ExporterConfig } from '@opentelemetry/exporter-prometheus';
import { MeterProvider } from '@opentelemetry/sdk-metrics';

declare module '@opentelemetry/exporter-prometheus' {
  interface ExporterConfig {
    startServer?: boolean;
  }
}

interface CustomMetricAttributes extends MetricAttributes {
  type?: string;
  metric?: string;
  rating?: string;
  source?: string;
  name?: string;
  line?: number;
  column?: number;
}

// Initialize the Prometheus exporter and metrics
// Create the Prometheus exporter
const prometheusExporter = new PrometheusExporter({
  port: 9464,
  startServer: true,
} as ExporterConfig);

// Create meter provider with the Prometheus exporter
const meterProvider = new MeterProvider({
  readers: [prometheusExporter],
});

// Register the meter provider globally
metrics.setGlobalMeterProvider(meterProvider);

// Create meters for different aspects
const performanceMeter = meterProvider.getMeter('performance');
const apiMeter = meterProvider.getMeter('api');
const systemMeter = meterProvider.getMeter('system');

// Create metrics with typed attributes
const requestDurationHistogram = performanceMeter.createHistogram<CustomMetricAttributes>(
  'http.request.duration',
  {
    description: 'Duration of HTTP requests',
    unit: 'ms',
  }
);

const requestCounter = apiMeter.createCounter<CustomMetricAttributes>('http.requests', {
  description: 'Count of HTTP requests',
});

const errorCounter = apiMeter.createCounter<CustomMetricAttributes>('http.errors', {
  description: 'Count of HTTP errors',
});

const memoryGauge = systemMeter.createUpDownCounter<CustomMetricAttributes>('system.memory.usage', {
  description: 'Memory usage',
  unit: 'bytes',
});

// AI-specific metrics
const aiRequestDurationHistogram = apiMeter.createHistogram<CustomMetricAttributes>(
  'ai.request.duration',
  {
    description: 'Duration of AI requests',
    unit: 'ms',
  }
);

const aiTokenCounter = apiMeter.createCounter<CustomMetricAttributes>('ai.tokens.used', {
  description: 'Number of AI tokens used',
});

const aiRateLimitGauge = apiMeter.createUpDownCounter<CustomMetricAttributes>('ai.rate.limit', {
  description: 'Current rate limit usage',
  unit: 'requests',
});

const aiErrorRateGauge = apiMeter.createUpDownCounter<CustomMetricAttributes>('ai.error.rate', {
  description: 'AI request error rate',
  unit: 'errors/minute',
});

export {
  requestDurationHistogram,
  requestCounter,
  errorCounter,
  memoryGauge,
  aiRequestDurationHistogram,
  aiTokenCounter,
  aiRateLimitGauge,
  aiErrorRateGauge,
};
