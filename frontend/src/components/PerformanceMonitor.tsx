import { useEffect } from 'react';
import { onCLS, onFCP, onFID, onLCP, onTTFB } from 'web-vitals';
import { reportWebVitals } from '../utils/webVitals';
import {
  requestDurationHistogram,
  requestCounter,
  errorCounter,
  memoryGauge,
} from '../config/metrics';

export function PerformanceMonitor() {
  useEffect(() => {
    // Core Web Vitals
    onCLS((metric) => {
      reportWebVitals(metric);
      requestDurationHistogram.record(metric.value * 1000, {
        metric: 'CLS',
        rating: metric.rating,
      });
    });

    onFID((metric) => {
      reportWebVitals(metric);
      requestDurationHistogram.record(metric.value, {
        metric: 'FID',
        rating: metric.rating,
      });
    });

    onLCP((metric) => {
      reportWebVitals(metric);
      requestDurationHistogram.record(metric.value, {
        metric: 'LCP',
        rating: metric.rating,
      });
    });

    onFCP((metric) => {
      reportWebVitals(metric);
      requestDurationHistogram.record(metric.value, {
        metric: 'FCP',
        rating: metric.rating,
      });
    });

    onTTFB((metric) => {
      reportWebVitals(metric);
      requestDurationHistogram.record(metric.value, {
        metric: 'TTFB',
        rating: metric.rating,
      });
    });

    // Error monitoring
    const originalOnError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      errorCounter.add(1, {
        type: error?.name || 'Unknown',
        source: source || 'Unknown',
        line: lineno,
        column: colno,
      });

      if (originalOnError) {
        return originalOnError.call(window, message, source, lineno, colno, error);
      }
      return false;
    };

    // Performance monitoring
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          requestDurationHistogram.record(navEntry.duration, {
            type: 'navigation',
          });
        } else if (entry.entryType === 'resource') {
          const resEntry = entry as PerformanceResourceTiming;
          requestCounter.add(1, {
            type: resEntry.initiatorType,
            name: resEntry.name,
          });
          requestDurationHistogram.record(resEntry.duration, {
            type: resEntry.initiatorType,
          });
        }
      }
    });

    observer.observe({
      entryTypes: ['navigation', 'resource'],
    });

    // Memory monitoring
    interface MemoryInfo {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    }

    interface PerformanceWithMemory extends Performance {
      memory?: MemoryInfo;
    }

    const monitorMemory = async () => {
      const perf = performance as PerformanceWithMemory;
      if (perf.memory) {
        memoryGauge.add(perf.memory.usedJSHeapSize, {
          type: 'heap',
          total: perf.memory.totalJSHeapSize,
          limit: perf.memory.jsHeapSizeLimit,
        });
      }
    };

    const memoryInterval = setInterval(monitorMemory, 30000);

    // Cleanup
    return () => {
      window.onerror = originalOnError;
      observer.disconnect();
      clearInterval(memoryInterval);
    };
  }, []);

  return null;
}
