'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

interface Store {
  id: number;
  name: string;
  location: string;
  floors: number;
  village?: string;
  address?: string;
}

interface StoreContextType {
  currentStore: number;
  setCurrentStore: (storeId: number) => void;
  stores: Store[];
  currentStoreData: Store | undefined;
  isLoading: boolean;
  refreshStores: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const useStoreContext = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStoreContext must be used within a StoreProvider');
  }
  return context;
};

interface StoreProviderProps {
  children: ReactNode;
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  const [currentStore, setCurrentStore] = useState<number>(1);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentStoreData = stores.find(store => store.id === currentStore);

  // Fetch stores from database
  const fetchStores = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Fetching stores from database...');
      
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('id');

      if (error) {
        console.error('❌ Error fetching stores:', error);
        // Fallback to default stores if table doesn't exist
        const fallbackStores = [
          { id: 1, name: 'Main Store', location: 'Downtown', floors: 3 },
          { id: 2, name: 'Branch Store', location: 'Uptown', floors: 2 },
          { id: 3, name: 'Mall Store', location: 'Shopping Center', floors: 1 }
        ];
        setStores(fallbackStores);
        console.log('⚠️ Using fallback stores:', fallbackStores);
      } else {
        console.log('✅ Stores fetched successfully:', data);
        setStores(data || []);
      }
    } catch (error) {
      console.error('❌ Unexpected error fetching stores:', error);
      // Fallback to default stores
      const fallbackStores = [
        { id: 1, name: 'Main Store', location: 'Downtown', floors: 3 },
        { id: 2, name: 'Branch Store', location: 'Uptown', floors: 2 },
        { id: 3, name: 'Mall Store', location: 'Shopping Center', floors: 1 }
      ];
      setStores(fallbackStores);
      console.log('⚠️ Using fallback stores due to error:', fallbackStores);
    } finally {
      setIsLoading(false);
    }
  };

  // Load store preference from localStorage and fetch stores
  useEffect(() => {
    const savedStore = localStorage.getItem('selectedStore');
    if (savedStore) {
      setCurrentStore(parseInt(savedStore));
    }
    fetchStores();
  }, []);

  // Save store preference to localStorage
  const handleSetCurrentStore = (storeId: number) => {
    console.log('🔄 Switching to store:', storeId);
    setCurrentStore(storeId);
    localStorage.setItem('selectedStore', storeId.toString());
  };

  const refreshStores = async () => {
    console.log('🔄 Refreshing stores...');
    await fetchStores();
  };

  const value: StoreContextType = {
    currentStore,
    setCurrentStore: handleSetCurrentStore,
    stores,
    currentStoreData,
    isLoading,
    refreshStores
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
};
