'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, MapPin, Building } from 'lucide-react';
import { useStoreContext } from '@/contexts/StoreContext';
import { useAuth } from '@/hooks/useAuth';

const StoreSelector: React.FC = () => {
  const { currentStore, setCurrentStore, stores, currentStoreData, isLoading } = useStoreContext();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Only show for business admin users
  const userRole = (user as any)?.user_metadata?.role;
  const shouldShow = userRole === 'business_admin';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdown when store changes
  useEffect(() => {
    setIsOpen(false);
  }, [currentStore]);

  if (!shouldShow) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        Loading stores...
      </div>
    );
  }

  const handleStoreSelect = (storeId: number) => {
    setCurrentStore(storeId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Building className="w-4 h-4 text-blue-600" />
        <div className="text-left">
          <div className="font-medium text-gray-900">
            {currentStoreData?.name || `Store ${currentStore}`}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <MapPin className="w-3 h-3" />
            {currentStoreData?.location || 'Location'}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="py-1">
            {stores.map((store) => (
              <button
                key={store.id}
                onClick={() => handleStoreSelect(store.id)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                  store.id === currentStore ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="font-medium">{store.name}</div>
                    <div className="text-xs text-gray-500">{store.location}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreSelector;
