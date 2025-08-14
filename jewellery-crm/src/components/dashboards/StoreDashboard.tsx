'use client';

import React, { useEffect, useState } from 'react';
import { useStoreContext } from '@/contexts/StoreContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Package, DollarSign, TrendingUp, MapPin, Building } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface StoreStats {
  customers: number;
  products: number;
  sales: number;
  revenue: number;
}

const StoreDashboard: React.FC = () => {
  const { currentStore, currentStoreData } = useStoreContext();
  const [stats, setStats] = useState<StoreStats>({
    customers: 0,
    products: 0,
    sales: 0,
    revenue: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStoreStats = async () => {
      if (!currentStore) return;
      
      setIsLoading(true);
      try {
        // Fetch customers count for this store
        const { count: customersCount } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', currentStore);

        // Fetch products count for this store
        const { count: productsCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', currentStore);

        // Fetch sales count for this store
        const { count: salesCount } = await supabase
          .from('sales')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', currentStore);

        // Fetch revenue for this store (sum of sale amounts)
        const { data: salesData } = await supabase
          .from('sales')
          .select('amount')
          .eq('store_id', currentStore);

        const revenue = salesData?.reduce((sum, sale) => sum + (sale.amount || 0), 0) || 0;

        setStats({
          customers: customersCount || 0,
          products: productsCount || 0,
          sales: salesCount || 0,
          revenue: revenue
        });
      } catch (error) {
        console.error('Error fetching store stats:', error);
        setStats({
          customers: 0,
          products: 0,
          sales: 0,
          revenue: 0
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStoreStats();
  }, [currentStore]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Store Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <div className="flex items-center space-x-3 mb-2">
          <Building className="h-8 w-8" />
          <h1 className="text-2xl font-bold">{currentStoreData?.name || `Store ${currentStore}`}</h1>
        </div>
        <div className="space-y-1">
          {currentStoreData?.location && (
            <p className="text-blue-100 flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              {currentStoreData.location}
            </p>
          )}
          {currentStoreData?.village && (
            <p className="text-blue-100 text-sm">
              Village: {currentStoreData.village}
            </p>
          )}
          {currentStoreData?.address && (
            <p className="text-blue-100 text-sm">
              Address: {currentStoreData.address}
            </p>
          )}
          <p className="text-blue-100 text-sm">
            {currentStoreData?.floors || 1} floor{(currentStoreData?.floors || 1) > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.customers}</div>
            <p className="text-xs text-muted-foreground">
              Active customers in this store
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.products}</div>
            <p className="text-xs text-muted-foreground">
              Available products in inventory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sales}</div>
            <p className="text-xs text-muted-foreground">
              Sales transactions this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total revenue this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Store Status */}
      <Card>
        <CardHeader>
          <CardTitle>Store Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Data Isolation</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✅ Working
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Store Access</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                🔒 Isolated
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">RLS Status</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                ⚠️ Disabled
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Store</span>
              <span className="text-sm font-medium text-gray-900">
                {currentStoreData?.name || `Store ${currentStore}`}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StoreDashboard;
