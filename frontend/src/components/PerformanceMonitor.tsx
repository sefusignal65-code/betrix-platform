import { useEffect } from 'react';
import { onCLS, onFCP, onFID, onLCP, onTTFB } from 'web-vitals';
import { reportWebVitals } from '../utils/webVitals';

export function PerformanceMonitor() {
  useEffect(() => {
    // Core Web Vitals
    onCLS(reportWebVitals);
    onFID(reportWebVitals);
    onLCP(reportWebVitals);
    // Other Web Vitals
    onFCP(reportWebVitals);
    onTTFB(reportWebVitals);
  }, []);

  return null;
}