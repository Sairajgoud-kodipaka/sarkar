/**
 * Business Admin Dashboard Component
 * 
 * Clean, minimalist dashboard following the STYLING_GUIDE.md specifications:
 * - Minimal visual noise and clutter
 * - Clean, calm design with proper spacing
 * - Simple, readable typography
 * - Subtle colors and minimal shadows
 * - Focus on content over decoration
 * 
 * Features:
 * - Real-time data updates with subtle indicators
 * - Clean CSV export functionality
 * - Minimalist card and table design
 * - Calm, professional appearance
 * - Consistent with design system
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  DashboardLayout, 
  CardContainer,
} from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download,
  Users,
  TrendingUp,
  IndianRupee,
  Calendar,
  ChevronDown,
  RefreshCw,
  Eye,
  ShoppingBag,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Activity,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Target,
  Award,
  Zap,
} from 'lucide-react';
import { apiService } from '@/lib/api-service';
import { useAuth } from '@/hooks/useAuth';

interface DashboardData {
  visitors: {
    today: number;
    this_week: number;
    this_month: number;
  };
  sales: {
    today: number;
    this_week: number;
    this_month: number;
  };
  floor_customers: Array<{
    floor: number;
    customers: Array<{
      name: string;
      number: string;
      interest: string;
    }>;
  }>;
}

/**
 * Business Admin Dashboard Component
 */
export function BusinessAdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [expandedFloors, setExpandedFloors] = useState<Set<number>>(new Set());
  const { user } = useAuth();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getDashboardData();
      if (response) {
        setDashboardData(response);
        setLastUpdated(new Date());
      } else {
        setError('Failed to load dashboard data');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const toggleFloorExpansion = (floor: number) => {
    const newExpanded = new Set(expandedFloors);
    if (newExpanded.has(floor)) {
      newExpanded.delete(floor);
    } else {
      newExpanded.add(floor);
    }
    setExpandedFloors(newExpanded);
  };

  const downloadCSV = async (dataType: 'visitors' | 'sales' | 'customers') => {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      let csvContent = '';
      let filename = '';

      switch (dataType) {
        case 'visitors':
          if (dashboardData) {
            csvContent = `Date,Visitors Today,Visitors This Week,Visitors This Month\n${timestamp},${dashboardData.visitors.today},${dashboardData.visitors.this_week},${dashboardData.visitors.this_month}`;
            filename = `visitors_${timestamp}.csv`;
          }
          break;
        case 'sales':
          if (dashboardData) {
            csvContent = `Date,Sales Today,Sales This Week,Sales This Month\n${timestamp},${dashboardData.sales.today},${dashboardData.sales.this_week},${dashboardData.sales.this_month}`;
            filename = `sales_${timestamp}.csv`;
          }
          break;
        case 'customers':
          if (dashboardData) {
            csvContent = `Floor,Name,Number,Interest\n`;
            dashboardData.floor_customers.forEach(floorData => {
              floorData.customers.forEach(customer => {
                csvContent += `${floorData.floor},${customer.name},${customer.number},${customer.interest}\n`;
              });
            });
            filename = `customers_${timestamp}.csv`;
          }
          break;
      }

      if (csvContent) {
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error downloading CSV:', err);
    }
  };

  if (loading && !dashboardData) {
    return (
      <DashboardLayout
        title="Dashboard"
        subtitle="Loading..."
      >
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-text-muted border-t-text-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-text-secondary">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !dashboardData) {
    return (
      <DashboardLayout
        title="Dashboard"
        subtitle="Error"
      >
        <div className="flex items-center justify-center h-96">
          <div className="text-center max-w-md">
            <p className="text-error-red mb-4">{error}</p>
            <Button 
              onClick={fetchDashboardData} 
              className="btn-primary"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle={`Welcome back, ${user?.email?.split('@')[0] || 'Admin'}`}
      actions={
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchDashboardData}
            disabled={loading}
            className="btn-secondary"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      }
    >
      {/* Clean 3x3 Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Top Row - Visitor Statistics */}
        <div className="bg-white rounded-lg border border-border-light p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-text-primary">Visitors Today</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => downloadCSV('visitors')}
              className="btn-tertiary p-1"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-center">
            <p className="text-3xl font-semibold text-text-primary mb-2">
              {dashboardData?.visitors.today || 0}
            </p>
            <p className="text-sm text-text-secondary">
              people visited today
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-border-light p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-text-primary">Visitors This Week</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => downloadCSV('visitors')}
              className="btn-tertiary p-1"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-center">
            <p className="text-3xl font-semibold text-text-primary mb-2">
              {dashboardData?.visitors.this_week || 0}
            </p>
            <p className="text-sm text-text-secondary">
              people visited this week
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-border-light p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-text-primary">Visitors This Month</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => downloadCSV('visitors')}
              className="btn-tertiary p-1"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-center">
            <p className="text-3xl font-semibold text-text-primary mb-2">
              {dashboardData?.visitors.this_month || 0}
            </p>
            <p className="text-sm text-text-secondary">
              people visited this month
            </p>
          </div>
        </div>

        {/* Middle Row - Sales Statistics */}
        <div className="bg-white rounded-lg border border-border-light p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-text-primary">Sales Today</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => downloadCSV('sales')}
              className="btn-tertiary p-1"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-center">
            <p className="text-3xl font-semibold text-text-primary mb-2 flex items-center justify-center">
              <IndianRupee className="w-6 h-6 mr-1" />
              {(dashboardData?.sales.today || 0).toLocaleString()}
            </p>
            <p className="text-sm text-text-secondary">
              sales today
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-border-light p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-text-primary">Sales This Week</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => downloadCSV('sales')}
              className="btn-tertiary p-1"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-center">
            <p className="text-3xl font-semibold text-text-primary mb-2 flex items-center justify-center">
              <IndianRupee className="w-6 h-6 mr-1" />
              {(dashboardData?.sales.this_week || 0).toLocaleString()}
            </p>
            <p className="text-sm text-text-secondary">
              sales this week
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-border-light p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-text-primary">Sales This Month</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => downloadCSV('sales')}
              className="btn-tertiary p-1"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-center">
            <p className="text-3xl font-semibold text-text-primary mb-2 flex items-center justify-center">
              <IndianRupee className="w-6 h-6 mr-1" />
              {(dashboardData?.sales.this_month || 0).toLocaleString()}
            </p>
            <p className="text-sm text-text-secondary">
              sales this month
            </p>
          </div>
        </div>

        {/* Bottom Row - Floor Customer Data */}
        {[1, 2, 3].map((floor) => {
          const floorData = dashboardData?.floor_customers.find(f => f.floor === floor);
          const isExpanded = expandedFloors.has(floor);
          const customersList = floorData?.customers || [];
          
          return (
            <div key={floor} className="bg-white rounded-lg border border-border-light p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-text-primary">Floor {floor} Customers</h3>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFloorExpansion(floor)}
                    className="btn-tertiary p-1"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  </Button>
                </div>
              </div>
              
              <div className="text-center mb-4">
                <p className="text-3xl font-semibold text-text-primary mb-2">
                  {customersList.length}
                </p>
                <p className="text-sm text-text-secondary">
                  customers
                </p>
              </div>

              {/* Simple Customer Table */}
              {isExpanded && floorData && (
                <div className="mt-4 border-t border-border-light pt-4">
                  <div className="text-sm font-medium text-text-primary mb-3 grid grid-cols-3 gap-4">
                    <div>Name</div>
                    <div>Number</div>
                    <div>Interest</div>
                  </div>
                  
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {customersList.length > 0 ? (
                      customersList.map((customer: { name: string; number: string; interest: string }, index: number) => (
                        <div 
                          key={index} 
                          className="grid grid-cols-3 gap-4 text-sm py-2 border-b border-border-light last:border-b-0"
                        >
                          <div className="text-text-primary truncate">{customer.name}</div>
                          <div className="text-text-secondary truncate">{customer.number}</div>
                          <div className="text-text-secondary truncate">
                            <span className="bg-text-muted/10 text-text-secondary px-2 py-1 rounded text-xs">
                              {customer.interest}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-text-muted">
                        <p className="text-sm">No customers found</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Simple Status Bar */}
      <div className="mt-8 p-4 bg-white rounded-lg border border-border-light">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-success-green rounded-full"></div>
              <span className="text-sm text-text-secondary">Live data</span>
            </div>
            <span className="text-sm text-text-muted">Updates every 30 seconds</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadCSV('visitors')}
              className="btn-secondary"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Visitors
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadCSV('sales')}
              className="btn-secondary"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Sales
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadCSV('customers')}
              className="btn-secondary"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Customers
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}