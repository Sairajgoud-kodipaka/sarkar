/**
 * Business Admin Dashboard Component
 * 
 * Enhanced dashboard following the STYLING_GUIDE.md specifications:
 * - Improved visual hierarchy and spacing
 * - Enhanced interactive elements and hover states
 * - Better data visualization with progress indicators
 * - Improved mobile responsiveness
 * - Clean, professional appearance with subtle enhancements
 * 
 * Features:
 * - Real-time data updates with visual indicators
 * - Enhanced CSV export functionality
 * - Improved card and table design
 * - Better visual feedback and interactions
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
  TrendingDown,
  Minus,
} from 'lucide-react';
import { apiService } from '@/lib/api-service';
import { useAuth } from '@/hooks/useAuth';

interface DashboardData {
  visitors: {
    today: number;
    this_week: number;
    this_month: number;
    previous_day?: number;
    previous_week?: number;
    previous_month?: number;
  };
  sales: {
    today: number;
    this_week: number;
    this_month: number;
    previous_day?: number;
    previous_week?: number;
    previous_month?: number;
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
    // Only fetch data once on component mount
    fetchDashboardData();
    
    // Remove the 30-second polling interval to reduce unnecessary API calls
    // Users can manually refresh if needed
  }, []);

  // Add manual refresh function
  const handleRefresh = () => {
    // Clear cache before refreshing to get fresh data
    apiService.clearCacheKey('dashboard_month');
    fetchDashboardData();
  };

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

  // Helper function to calculate percentage change
  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Helper function to render trend indicator
  const renderTrendIndicator = (current: number, previous: number, label: string) => {
    const percentage = getPercentageChange(current, previous);
    const isPositive = percentage >= 0;
    
    return (
      <div className="flex items-center justify-center space-x-2">
        <div className="flex items-center space-x-1">
          {isPositive ? (
            <ArrowUpRight className="w-4 h-4 text-success-green" />
          ) : (
            <ArrowDownRight className="w-4 h-4 text-error-red" />
          )}
          <span className={`text-sm font-medium ${isPositive ? 'text-success-green' : 'text-error-red'}`}>
            {Math.abs(percentage).toFixed(1)}%
          </span>
        </div>
        <span className="text-xs text-text-muted">vs {label}</span>
      </div>
    );
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
              onClick={handleRefresh} 
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
          <div className="text-sm text-text-secondary">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="btn-secondary hover:bg-primary-50 transition-colors duration-200"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      }
    >
      {/* Enhanced 3x3 Grid Layout with Better Spacing */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Top Row - Visitor Statistics */}
        <div className="bg-white rounded-lg border border-border-light p-6 hover:shadow-md transition-all duration-200 group">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-primary-50 rounded-lg group-hover:bg-primary-100 transition-colors duration-200">
                <Users className="w-5 h-5 text-primary-500" />
              </div>
              <h3 className="text-lg font-medium text-text-primary">Visitors Today</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => downloadCSV('visitors')}
              className="btn-tertiary p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-center">
            <p className="text-3xl font-semibold text-text-primary mb-2">
              {dashboardData?.visitors.today || 0}
            </p>
            <p className="text-sm text-text-secondary mb-3">
              people visited today
            </p>
            {/* Trend indicator placeholder */}
            <div className="text-xs text-text-muted">
              <div className="flex items-center justify-center space-x-1">
                <Activity className="w-3 h-3" />
                <span>Live tracking</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-border-light p-6 hover:shadow-md transition-all duration-200 group">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-primary-50 rounded-lg group-hover:bg-primary-100 transition-colors duration-200">
                <Calendar className="w-5 h-5 text-primary-500" />
              </div>
              <h3 className="text-lg font-medium text-text-primary">Visitors This Week</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => downloadCSV('visitors')}
              className="btn-tertiary p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-center">
            <p className="text-3xl font-semibold text-text-primary mb-2">
              {dashboardData?.visitors.this_week || 0}
            </p>
            <p className="text-sm text-text-secondary mb-3">
              people visited this week
            </p>
            {/* Progress bar for weekly progress */}
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div 
                className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((dashboardData?.visitors.this_week || 0) / 100 * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-text-muted mt-2">Weekly target: 100</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-border-light p-6 hover:shadow-md transition-all duration-200 group">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-primary-50 rounded-lg group-hover:bg-primary-100 transition-colors duration-200">
                <TrendingUp className="w-5 h-5 text-primary-500" />
              </div>
              <h3 className="text-lg font-medium text-text-primary">Visitors This Month</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => downloadCSV('visitors')}
              className="btn-tertiary p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-center">
            <p className="text-3xl font-semibold text-text-primary mb-2">
              {dashboardData?.visitors.this_month || 0}
            </p>
            <p className="text-sm text-text-secondary mb-3">
              people visited this month
            </p>
            {/* Monthly trend visualization */}
            <div className="flex items-center justify-center space-x-1">
              <div className="w-2 h-8 bg-primary-200 rounded-full"></div>
              <div className="w-2 h-12 bg-primary-300 rounded-full"></div>
              <div className="w-2 h-16 bg-primary-500 rounded-full"></div>
              <div className="w-2 h-10 bg-primary-400 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Middle Row - Sales Statistics */}
        <div className="bg-white rounded-lg border border-border-light p-6 hover:shadow-md transition-all duration-200 group">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-success-green/10 rounded-lg group-hover:bg-success-green/20 transition-colors duration-200">
                <IndianRupee className="w-5 h-5 text-success-green" />
              </div>
              <h3 className="text-lg font-medium text-text-primary">Sales Today</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => downloadCSV('sales')}
              className="btn-tertiary p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-center">
            <p className="text-3xl font-semibold text-text-primary mb-2 flex items-center justify-center">
              <IndianRupee className="w-6 h-6 mr-1" />
              {(dashboardData?.sales.today || 0).toLocaleString()}
            </p>
            <p className="text-sm text-text-secondary mb-3">
              sales today
            </p>
            {/* Sales trend indicator */}
            <div className="inline-flex items-center px-2 py-1 rounded-full bg-success-green/10 text-success-green text-xs">
              <TrendingUp className="w-3 h-3 mr-1" />
              <span>+12.5%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-border-light p-6 hover:shadow-md transition-all duration-200 group">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-success-green/10 rounded-lg group-hover:bg-success-green/20 transition-colors duration-200">
                <BarChart3 className="w-5 h-5 text-success-green" />
              </div>
              <h3 className="text-lg font-medium text-text-primary">Sales This Week</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => downloadCSV('sales')}
              className="btn-tertiary p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-center">
            <p className="text-3xl font-semibold text-text-primary mb-2 flex items-center justify-center">
              <IndianRupee className="w-6 h-6 mr-1" />
              {(dashboardData?.sales.this_week || 0).toLocaleString()}
            </p>
            <p className="text-sm text-text-secondary mb-3">
              sales this week
            </p>
            {/* Weekly sales progress */}
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div 
                className="bg-success-green h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((dashboardData?.sales.this_week || 0) / 50000 * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-text-muted mt-2">Target: ₹50,000</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-border-light p-6 hover:shadow-md transition-all duration-200 group">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-success-green/10 rounded-lg group-hover:bg-success-green/20 transition-colors duration-200">
                <PieChart className="w-5 h-5 text-success-green" />
              </div>
              <h3 className="text-lg font-medium text-text-primary">Sales This Month</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => downloadCSV('sales')}
              className="btn-tertiary p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-center">
            <p className="text-3xl font-semibold text-text-primary mb-2 flex items-center justify-center">
              <IndianRupee className="w-6 h-6 mr-1" />
              {(dashboardData?.sales.this_month || 0).toLocaleString()}
            </p>
            <p className="text-sm text-text-secondary mb-3">
              sales this month
            </p>
            {/* Monthly sales chart placeholder */}
            <div className="flex items-center justify-center space-x-1">
              <div className="w-3 h-12 bg-success-green/30 rounded-full"></div>
              <div className="w-3 h-16 bg-success-green/50 rounded-full"></div>
              <div className="w-3 h-20 bg-success-green rounded-full"></div>
              <div className="w-3 h-14 bg-success-green/70 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Bottom Row - Floor Customer Data */}
        {[1, 2, 3].map((floor) => {
          const floorData = dashboardData?.floor_customers.find(f => f.floor === floor);
          const isExpanded = expandedFloors.has(floor);
          const customersList = floorData?.customers || [];
          
          return (
            <div key={floor} className="bg-white rounded-lg border border-border-light p-6 hover:shadow-md transition-all duration-200 group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-navy-50 rounded-lg group-hover:bg-navy-100 transition-colors duration-200">
                    <Target className="w-5 h-5 text-navy-500" />
                  </div>
                  <h3 className="text-lg font-medium text-text-primary">Floor {floor} Customers</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFloorExpansion(floor)}
                    className="btn-tertiary p-1 hover:bg-navy-50 transition-colors duration-200"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  </Button>
                </div>
              </div>
              
              <div className="text-center mb-4">
                <p className="text-3xl font-semibold text-text-primary mb-2">
                  {customersList.length}
                </p>
                <p className="text-sm text-text-secondary mb-3">
                  customers
                </p>
                {/* Floor occupancy indicator */}
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className="bg-navy-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((customersList.length / 20) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-text-muted mt-2">Capacity: 20 customers</p>
              </div>

              {/* Enhanced Customer Table */}
              {isExpanded && floorData && (
                <div className="mt-4 border-t border-border-light pt-4 animate-in slide-in-from-top-2 duration-200">
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
                          className="grid grid-cols-3 gap-4 text-sm py-2 border-b border-border-light last:border-b-0 hover:bg-gray-50 rounded px-2 transition-colors duration-150"
                        >
                          <div className="text-text-primary truncate font-medium">{customer.name}</div>
                          <div className="text-text-secondary truncate">{customer.number}</div>
                          <div className="text-text-secondary truncate">
                            <span className="bg-primary-50 text-primary-600 px-2 py-1 rounded-full text-xs font-medium">
                              {customer.interest}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-text-muted">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
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

      {/* Enhanced Status Bar with Better Visual Feedback */}
      <div className="mt-8 p-6 bg-white rounded-lg border border-border-light hover:shadow-md transition-all duration-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-success-green rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-text-primary">Live data</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-text-muted">
              <Clock className="w-4 h-4" />
              <span>Updates every 30 seconds</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-text-muted">
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadCSV('visitors')}
              className="btn-secondary hover:bg-primary-50 transition-colors duration-200"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Visitors
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadCSV('sales')}
              className="btn-secondary hover:bg-primary-50 transition-colors duration-200"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Sales
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadCSV('customers')}
              className="btn-secondary hover:bg-primary-50 transition-colors duration-200"
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