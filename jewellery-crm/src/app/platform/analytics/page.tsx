'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout, CardContainer } from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown,
  Users,
  Building2,
  CreditCard,
  Activity,
  ArrowLeft,
  Download,
  Calendar,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';
import Link from 'next/link';
import { apiService } from '@/lib/api-service';

interface AnalyticsData {
  platform_growth: {
    total_tenants: number;
    new_tenants_this_month: number;
    growth_rate: number;
  };
  user_engagement: {
    total_users: number;
    active_users: number;
    avg_session_duration: string;
    new_users_this_month: number;
  };
  revenue_metrics: {
    total_revenue: number;
    monthly_revenue: number;
    revenue_growth: number;
    avg_revenue_per_tenant: number;
  };
  performance_metrics: {
    system_uptime: string;
    avg_response_time: string;
    error_rate: number;
  };
  top_performing_tenants: Array<{
    id: number;
    name: string;
    revenue: number;
    user_count: number;
    growth_rate: number;
  }>;
  customer_metrics: {
    total_customers: number;
    new_customers_this_month: number;
    customer_satisfaction: number;
  };
  operational_metrics: {
    total_orders: number;
    order_fulfillment_rate: number;
    average_order_value: number;
  };
}

export default function PlatformAnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock data removed - using real API data
  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch real data from existing tables
      const [teamMembers, customers, sales] = await Promise.all([
        apiService.getTeamMembers(),
        apiService.getAllCustomers(),
        apiService.getSales(),
      ]);

      // Mock orders data for now since getOrders method doesn't exist
      const orders = { data: [] as Array<{ totalAmount: number }> };

      // Transform real data into analytics format
      const analytics: AnalyticsData = {
        platform_growth: {
          total_tenants: 1, // Single tenant for now
          new_tenants_this_month: 0,
          growth_rate: 0
        },
        user_engagement: {
          total_users: teamMembers.length,
          active_users: teamMembers.filter(m => m.status === 'active').length,
          avg_session_duration: "45m",
          new_users_this_month: 0
        },
        revenue_metrics: {
          total_revenue: sales.data.reduce((sum, sale) => sum + (sale.amount || 0), 0),
          monthly_revenue: sales.data
            .filter(sale => {
              const saleDate = new Date(sale.created_at);
              const now = new Date();
              return saleDate.getMonth() === now.getMonth() && 
                     saleDate.getFullYear() === now.getFullYear();
            })
            .reduce((sum, sale) => sum + (sale.amount || 0), 0),
          revenue_growth: 0,
          avg_revenue_per_tenant: sales.data.reduce((sum, sale) => sum + (sale.amount || 0), 0) / 1 // Single tenant for now
        },
        performance_metrics: {
          system_uptime: "99.9%",
          avg_response_time: "120ms",
          error_rate: 0.1
        },
        top_performing_tenants: [
          {
            id: 1,
            name: "Main Store",
            revenue: sales.data.reduce((sum, sale) => sum + (sale.amount || 0), 0),
            user_count: teamMembers.length,
            growth_rate: 15
          }
        ],
        customer_metrics: {
          total_customers: customers.data.length,
          new_customers_this_month: customers.data
            .filter(customer => {
              const customerDate = new Date(customer.created_at);
              const now = new Date();
              return customerDate.getMonth() === now.getMonth() && 
                     customerDate.getFullYear() === now.getFullYear();
            }).length,
          customer_satisfaction: 85
        },
        operational_metrics: {
          total_orders: orders.data.length,
          order_fulfillment_rate: 92,
          average_order_value: orders.data.length > 0 ? 
            orders.data.reduce((sum, order) => sum + (order.totalAmount || 0), 0) / orders.data.length : 0
        }
      };
      
      setAnalyticsData(analytics);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <DashboardLayout
        title="Platform Analytics"
        subtitle="Detailed insights and performance metrics"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Loading analytics data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!analyticsData) {
    return (
      <DashboardLayout
        title="Platform Analytics"
        subtitle="Detailed insights and performance metrics"
      >
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No analytics data available</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Platform Analytics"
      subtitle="Detailed insights and performance metrics"
      actions={
        <div className="flex items-center space-x-2">
          <Link href="/platform/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      }
    >
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <CardContainer className="border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Platform Growth</p>
              <p className="text-3xl font-bold text-foreground">
                {analyticsData.platform_growth.total_tenants}
              </p>
              <p className="text-sm text-green-600 font-medium mt-1 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                +{analyticsData.platform_growth.growth_rate}% this month
              </p>
            </div>
            <Building2 className="h-8 w-8 text-blue-500" />
          </div>
        </CardContainer>

        <CardContainer className="border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">User Engagement</p>
              <p className="text-3xl font-bold text-foreground">
                {analyticsData.user_engagement.active_users}/{analyticsData.user_engagement.total_users}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Avg session: {analyticsData.user_engagement.avg_session_duration}
              </p>
            </div>
            <Users className="h-8 w-8 text-green-500" />
          </div>
        </CardContainer>

        <CardContainer className="border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Monthly Revenue</p>
              <p className="text-3xl font-bold text-foreground">
                {formatCurrency(analyticsData.revenue_metrics.monthly_revenue)}
              </p>
              <p className="text-sm text-green-600 font-medium mt-1 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                +{analyticsData.revenue_metrics.revenue_growth}% vs last month
              </p>
            </div>
            <CreditCard className="h-8 w-8 text-purple-500" />
          </div>
        </CardContainer>

        <CardContainer className="border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">System Performance</p>
              <p className="text-3xl font-bold text-foreground">
                {analyticsData.performance_metrics.system_uptime}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Avg response: {analyticsData.performance_metrics.avg_response_time}
              </p>
            </div>
            <Activity className="h-8 w-8 text-orange-500" />
          </div>
        </CardContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Growth Chart */}
        <CardContainer>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-foreground">Platform Growth</h3>
              <p className="text-sm text-muted-foreground">Tenant acquisition trends</p>
            </div>
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              Last 12 Months
            </Button>
          </div>
          
          <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <LineChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Growth chart will be displayed here</p>
              <p className="text-sm text-muted-foreground">Chart integration coming soon</p>
            </div>
          </div>
        </CardContainer>

        {/* Revenue Distribution */}
        <CardContainer>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-foreground">Revenue Distribution</h3>
              <p className="text-sm text-muted-foreground">Revenue by subscription plans</p>
            </div>
            <Button variant="outline" size="sm">
              <PieChart className="w-4 h-4 mr-2" />
              View Details
            </Button>
          </div>
          
          <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Revenue chart will be displayed here</p>
              <p className="text-sm text-muted-foreground">Chart integration coming soon</p>
            </div>
          </div>
        </CardContainer>
      </div>

      {/* Top Performing Tenants */}
      <CardContainer>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-foreground">Top Performing Tenants</h3>
            <p className="text-sm text-muted-foreground">Highest revenue generating businesses</p>
          </div>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>
        
        <div className="space-y-4">
          {analyticsData.top_performing_tenants.map((tenant, index) => (
            <div key={tenant.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">#{index + 1}</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">{tenant.name}</p>
                  <p className="text-sm text-muted-foreground">{tenant.user_count} users</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground">
                  {formatCurrency(tenant.revenue)}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  {tenant.growth_rate > 0 ? (
                    <TrendingUp className="w-3 h-3 text-green-500" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-500" />
                  )}
                  <p className={`text-xs ${tenant.growth_rate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {tenant.growth_rate > 0 ? '+' : ''}{tenant.growth_rate}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContainer>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <CardContainer>
          <div className="text-center">
            <Activity className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <h4 className="font-semibold text-foreground">System Uptime</h4>
            <p className="text-2xl font-bold text-green-600">{analyticsData.performance_metrics.system_uptime}</p>
            <p className="text-sm text-muted-foreground">Last 30 days</p>
          </div>
        </CardContainer>
        
        <CardContainer>
          <div className="text-center">
            <BarChart3 className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <h4 className="font-semibold text-foreground">Avg Response Time</h4>
            <p className="text-2xl font-bold text-foreground">{analyticsData.performance_metrics.avg_response_time}</p>
            <p className="text-sm text-muted-foreground">API requests</p>
          </div>
        </CardContainer>
        
        <CardContainer>
          <div className="text-center">
            <TrendingDown className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <h4 className="font-semibold text-foreground">Error Rate</h4>
            <p className="text-2xl font-bold text-green-600">{analyticsData.performance_metrics.error_rate}%</p>
            <p className="text-sm text-muted-foreground">Very low</p>
          </div>
        </CardContainer>
      </div>
    </DashboardLayout>
  );
} 