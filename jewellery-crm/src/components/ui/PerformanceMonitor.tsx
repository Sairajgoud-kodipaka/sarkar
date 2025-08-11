'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseTime: number;
  memoryUsage: number;
  isSlow: boolean;
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    pageLoadTime: 0,
    apiResponseTime: 0,
    memoryUsage: 0,
    isSlow: false
  });

  useEffect(() => {
    // Measure page load time
    const startTime = performance.now();
    
    const measurePerformance = () => {
      const loadTime = performance.now() - startTime;
      
      // Get memory usage if available
      const memory = (performance as any).memory;
      const memoryUsage = memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : 0;
      
      // Check if performance is slow (load time > 3 seconds)
      const isSlow = loadTime > 3000;
      
      setMetrics({
        pageLoadTime: Math.round(loadTime),
        apiResponseTime: 0,
        memoryUsage,
        isSlow
      });
    };

    // Measure when page is fully loaded
    if (document.readyState === 'complete') {
      measurePerformance();
    } else {
      window.addEventListener('load', measurePerformance);
      return () => window.removeEventListener('load', measurePerformance);
    }
  }, []);

  // Only show if there are performance issues
  if (!metrics.isSlow && metrics.pageLoadTime < 2000) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 right-4 p-3 rounded-lg shadow-lg border ${
      metrics.isSlow ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'
    }`}>
      <div className="flex items-center space-x-2">
        {metrics.isSlow ? (
          <AlertTriangle className="w-4 h-4 text-yellow-600" />
        ) : (
          <CheckCircle className="w-4 h-4 text-green-600" />
        )}
        <div className="text-sm">
          <div className="font-medium">
            {metrics.isSlow ? 'Performance Warning' : 'Performance OK'}
          </div>
          <div className="text-xs text-gray-600">
            Load: {metrics.pageLoadTime}ms
            {metrics.memoryUsage > 0 && ` | Memory: ${metrics.memoryUsage}MB`}
          </div>
        </div>
      </div>
    </div>
  );
}
