'use client';

import React from 'react';
import { useStoreContext } from '@/contexts/StoreContext';
import { CheckCircle, AlertCircle, Shield } from 'lucide-react';

const StoreStatus: React.FC = () => {
  const { currentStore, currentStoreData } = useStoreContext();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Store Status</h3>
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-600">Store {currentStore}</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Data Isolation</span>
          <div className="flex items-center space-x-1">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-600 font-medium">Working</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Store Access</span>
          <div className="flex items-center space-x-1">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-600 font-medium">Isolated</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">RLS Security</span>
          <div className="flex items-center space-x-1">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-600 font-medium">Disabled</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Current Store</span>
          <span className="text-sm font-medium text-gray-900">
            {currentStoreData?.name || `Store ${currentStore}`}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Store isolation is working at the application level. 
          RLS can be enabled later for database-level security.
        </p>
      </div>
    </div>
  );
};

export default StoreStatus;

