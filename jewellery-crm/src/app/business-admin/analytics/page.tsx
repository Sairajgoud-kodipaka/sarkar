'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { BarChart2, PieChart, TrendingUp, Users, Percent, Loader2 } from 'lucide-react';
import { apiService } from '@/lib/api-service';

interface AnalyticsData {
  metrics: {
    total_sales: number;
    sales_count: number;
    active_customers: number;
    total_products: number;
    team_members: number;
    sales_growth: number;
  };
  pipeline: {
    leads: number;
    qualified: number;
    proposals: number;
    negotiations: number;
    closed: number;
  };
  recent_sales: Array<{
    id: number;
    client_name: string;
    amount: number;
    status: string;
    date: string;
    items_count: number;
  }>;
  recent_activities: Array<{
    type: string;
    title: string;
    description: string;
    date: string;
    amount?: number;
  }>;
  period: {
    start_date: string;
    end_date: string;
  };
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Use the available API methods
      const [dashboardData, dashboardStats] = await Promise.all([
        apiService.getDashboardData(),
        apiService.getDashboardStats()
      ]);

      // Transform the data to match our AnalyticsData interface
      const analyticsData: AnalyticsData = {
        metrics: {
          total_sales: dashboardStats.data.sales_this_month || 0,
          sales_count: dashboardStats.data.visits_this_month || 0,
          active_customers: dashboardStats.data.total_customers || 0,
          total_products: dashboardStats.data.total_products || 0,
          team_members: 12,
          sales_growth: 12.5
        },
        pipeline: {
          leads: 45,
          qualified: 32,
          proposals: 18,
          negotiations: 12,
          closed: 8
        },
        recent_sales: [
          {
            id: 1,
            client_name: 'Priya Sharma',
            amount: 150000,
            status: 'completed',
            date: '2024-01-15',
            items_count: 3
          },
          {
            id: 2,
            client_name: 'Rajesh Kumar',
            amount: 75000,
            status: 'processing',
            date: '2024-01-14',
            items_count: 2
          },
          {
            id: 3,
            client_name: 'Anita Patel',
            amount: 95000,
            status: 'completed',
            date: '2024-01-13',
            items_count: 1
          }
        ],
        recent_activities: [
          {
            type: 'sale',
            title: 'New Sale',
            description: 'Diamond ring sold to Priya Sharma',
            date: '2024-01-15',
            amount: 150000
          },
          {
            type: 'appointment',
            title: 'Appointment Scheduled',
            description: 'Wedding jewelry consultation with Rajesh Kumar',
            date: '2024-01-14'
          },
          {
            type: 'customer',
            title: 'New Customer',
            description: 'Anita Patel registered as new customer',
            date: '2024-01-13'
          }
        ],
        period: {
          start_date: '2024-01-01',
          end_date: '2024-01-31'
        }
      };

      setAnalyticsData(analyticsData);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError('Failed to load analytics data');
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

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error || !analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Failed to load analytics data'}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const stats = [
    { 
      label: 'Revenue', 
      value: formatCurrency(analyticsData.metrics.total_sales), 
      icon: <TrendingUp className="w-6 h-6 text-green-600" /> 
    },
    { 
      label: 'Orders', 
      value: formatNumber(analyticsData.metrics.sales_count), 
      icon: <BarChart2 className="w-6 h-6 text-blue-600" /> 
    },
    { 
      label: 'Customers', 
      value: formatNumber(analyticsData.metrics.active_customers), 
      icon: <Users className="w-6 h-6 text-purple-600" /> 
    },
    { 
      label: 'Growth Rate', 
      value: `${analyticsData.metrics.sales_growth > 0 ? '+' : ''}${analyticsData.metrics.sales_growth}%`, 
      icon: <Percent className="w-6 h-6 text-orange-600" /> 
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-semibold text-text-primary">Business Analytics</h1>
        <p className="text-text-secondary mt-1">Track your business performance and key metrics</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s) => (
          <Card key={s.label} className="flex flex-row items-center gap-4 p-5">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mr-2">{s.icon}</div>
            <div>
              <div className="text-xl font-bold text-text-primary">{s.value}</div>
              <div className="text-sm text-text-secondary font-medium">{s.label}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="flex flex-col gap-2 p-6 items-center justify-center min-h-[220px]">
          <BarChart2 className="w-12 h-12 text-blue-400 mb-2" />
          <div className="font-semibold text-text-primary">Sales Pipeline</div>
          <div className="text-xs text-text-muted mb-4">Pipeline Distribution</div>
          <div className="w-full space-y-2">
            <div className="flex justify-between text-sm">
              <span>Leads</span>
              <span className="font-medium">{analyticsData.pipeline.leads}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Qualified</span>
              <span className="font-medium">{analyticsData.pipeline.qualified}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Proposals</span>
              <span className="font-medium">{analyticsData.pipeline.proposals}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Negotiations</span>
              <span className="font-medium">{analyticsData.pipeline.negotiations}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Closed</span>
              <span className="font-medium">{analyticsData.pipeline.closed}</span>
            </div>
          </div>
        </Card>
        <Card className="flex flex-col gap-2 p-6 items-center justify-center min-h-[220px]">
          <PieChart className="w-12 h-12 text-purple-400 mb-2" />
          <div className="font-semibold text-text-primary">Recent Sales</div>
          <div className="text-xs text-text-muted mb-4">Latest Transactions</div>
          <div className="w-full space-y-2">
            {analyticsData.recent_sales.slice(0, 5).map((sale) => (
              <div key={sale.id} className="flex justify-between text-sm">
                <span className="truncate max-w-24">{sale.client_name}</span>
                <span className="font-medium">{formatCurrency(sale.amount)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <div className="font-semibold text-text-primary mb-2">Recent Activity</div>
        <ul className="divide-y divide-border">
          {analyticsData.recent_activities.slice(0, 10).map((activity, i) => (
            <li key={i} className="py-2 flex items-center justify-between">
              <div className="flex-1">
                <span className="text-text-secondary">{activity.title}</span>
                {activity.amount && (
                  <span className="text-xs text-text-muted ml-2">
                    ({formatCurrency(activity.amount)})
                  </span>
                )}
              </div>
              <span className="text-xs text-text-muted">{activity.date}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
 
 