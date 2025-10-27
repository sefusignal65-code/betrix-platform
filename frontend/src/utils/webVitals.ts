import {
  type CLSMetric,
  type FCPMetric,
  type FIDMetric,
  type LCPMetric,
  type TTFBMetric,
} from 'web-vitals';

export type WebVitalsMetric = CLSMetric | FCPMetric | FIDMetric | LCPMetric | TTFBMetric;

export function reportWebVitals(metric: WebVitalsMetric) {
  // Analytics can be sent to your preferred service

  // Example implementation for Google Analytics
  const analyticsId = import.meta.env.VITE_GA_ID;
  if (analyticsId) {
    (window as Window).gtag?.('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_category: 'Web Vitals',
      event_label: metric.id,
      non_interaction: true,
    });
  }
}
