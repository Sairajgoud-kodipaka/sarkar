import React from 'react';
import StoreDashboard from '@/components/dashboards/StoreDashboard';

export default function StoreDashboardPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Store Dashboard</h1>
        <p className="text-gray-600 mt-2">
          View store-specific data and performance metrics
        </p>
      </div>
      
      <StoreDashboard />
    </div>
  );
}

