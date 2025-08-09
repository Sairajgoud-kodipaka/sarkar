'use client';
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, Users, Percent, ShoppingBag, Calendar, DollarSign } from 'lucide-react';
import { apiService } from '@/lib/api-service';
import { Sale, Client, Appointment } from '@/lib/api-service';

interface SalesStats {
  totalSales: number;
  totalDeals: number;  // This now represents total sales (including closed won pipelines)
  totalCustomers: number;
  conversionRate: number;
  monthlyRevenue: number;
  pendingOrders: number;
}

interface RecentActivity {
  id: number;
  type: 'sale' | 'appointment' | 'customer';
  title: string;
  description: string;
  amount?: number;
  date: string;
}

export default function SalesDashboardPage() {
  const [stats, setStats] = useState<SalesStats>({
    totalSales: 0,
    totalDeals: 0,
    totalCustomers: 0,
    conversionRate: 0,
    monthlyRevenue: 0,
    pendingOrders: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [topProducts, setTopProducts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        console.log('Starting to fetch dashboard data...');
        
        // Fetch sales dashboard data (includes sales + closed won pipeline)
        const dashboardResponse = await apiService.getSalesDashboard();
        console.log('Sales Dashboard API response:', dashboardResponse);
        
        if (dashboardResponse.success && dashboardResponse.data) {
          const dashboardData = dashboardResponse.data;
          
          setStats({
            totalSales: dashboardData.sales_count || 0,
            totalDeals: dashboardData.total_deals || 0,
            totalCustomers: dashboardData.total_customers || 0,
            conversionRate: dashboardData.conversion_rate || 0,
            monthlyRevenue: dashboardData.monthly_revenue || 0,
            pendingOrders: 0, // This would need to be calculated separately if needed
          });
          
          console.log('Dashboard stats set:', dashboardData);
        } else {
          console.error('Failed to fetch dashboard data:', dashboardResponse);
        }
        
        // Fetch recent activities (appointments)
        const appointmentsResponse = await apiService.getAppointments();
        console.log('Appointments API response:', appointmentsResponse);
        
        // Handle different response structures
        let appointments: any[] = [];
        if (appointmentsResponse.data) {
          if (Array.isArray(appointmentsResponse.data)) {
            appointments = appointmentsResponse.data;
          } else if (typeof appointmentsResponse.data === 'object' && 'results' in appointmentsResponse.data) {
            appointments = (appointmentsResponse.data as any).results;
          } else if (typeof appointmentsResponse.data === 'object' && 'data' in appointmentsResponse.data) {
            appointments = (appointmentsResponse.data as any).data;
          } else {
            appointments = [appointmentsResponse.data];
          }
        }
        console.log('Processed appointments data:', appointments);
        console.log('Appointments count:', appointments.length);

        // Prepare recent activities
        const activities: RecentActivity[] = [];
        
        // Add recent appointments
        if (Array.isArray(appointments)) {
          try {
            appointments.slice(0, 8).forEach((appointment: any) => {
              activities.push({
                id: appointment?.id || 0,
                type: 'appointment',
                title: `Appointment`,
                description: appointment?.purpose || 'No purpose specified',
                date: appointment?.date || new Date().toISOString(),
              });
            });
          } catch (error) {
            console.error('Error processing appointments for activities:', error);
          }
        }

        // Sort by date and take top 8
        activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setRecentActivities(activities.slice(0, 8));

        // Mock top products (in real implementation, this would come from backend)
        setTopProducts(['Gold Necklace', 'Diamond Ring', 'Silver Anklet', 'Pearl Earrings']);

        console.log('Dashboard data fetch completed successfully');

      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        console.error('Error details:', {
          message: error?.message || 'Unknown error',
          stack: error?.stack || 'No stack trace',
          name: error?.name || 'Unknown error type'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-8">
        <div className="mb-2">
          <h1 className="text-2xl font-semibold text-text-primary">Sales Dashboard</h1>
          <p className="text-text-secondary mt-1">Track your personal sales performance</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="flex flex-row items-center gap-4 p-5 animate-pulse">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="mb-2">
        <h1 className="text-2xl font-semibold text-text-primary">Sales Dashboard</h1>
        <p className="text-text-secondary mt-1">Track your personal sales performance</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="flex flex-row items-center gap-4 p-5">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mr-2">
            <DollarSign className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <div className="text-xl font-bold text-text-primary">{formatCurrency(stats.monthlyRevenue)}</div>
            <div className="text-sm text-text-secondary font-medium">Monthly Revenue</div>
          </div>
        </Card>
        
        <Card className="flex flex-row items-center gap-4 p-5">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mr-2">
            <ShoppingBag className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <div className="text-xl font-bold text-text-primary">{stats.totalDeals}</div>
            <div className="text-sm text-text-secondary font-medium">Total Sales</div>
          </div>
        </Card>
        
        <Card className="flex flex-row items-center gap-4 p-5">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mr-2">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <div className="text-xl font-bold text-text-primary">{stats.totalCustomers}</div>
            <div className="text-sm text-text-secondary font-medium">Customers</div>
          </div>
        </Card>
        
        <Card className="flex flex-row items-center gap-4 p-5">
          <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mr-2">
            <Percent className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <div className="text-xl font-bold text-text-primary">{stats.conversionRate}%</div>
            <div className="text-sm text-text-secondary font-medium">Conversion Rate</div>
          </div>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Recent Activity
          </div>
          <div className="space-y-3">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div key={`${activity.type}-${activity.id}`} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <div className="font-medium text-sm text-text-primary">{activity.title}</div>
                    <div className="text-xs text-text-secondary">{activity.description}</div>
                    {activity.amount && (
                      <div className="text-xs font-medium text-green-600 mt-1">
                        {formatCurrency(activity.amount)}
                      </div>
                    )}
                    <div className="text-xs text-text-secondary mt-1">
                      {formatDate(activity.date)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-text-secondary">No recent activity</div>
            )}
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="font-semibold mb-4">Top Products</div>
          <div className="space-y-2">
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-text-primary">{product}</span>
                <span className="text-xs text-text-secondary">#{index + 1}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
