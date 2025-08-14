/**
 * Store Manager Dashboard Component
 * 
 * Store-specific overview for jewellery store managers.
 * Features store analytics, team performance, local operations, and customer management.
 * 
 * Key Features:
 * - Store-specific revenue and sales metrics
 * - Sales team performance tracking
 * - Local customer management
 * - Appointment scheduling overview
 * - Store inventory management
 * - Daily operations tracking
 */

'use client';

import React from 'react';
import { 
  DashboardLayout, 
  CardContainer,
} from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Store,
  Users, 
  ShoppingBag,
  Calendar,
  Package,
  Target,
  TrendingUp,
  Clock,
  Plus,
  UserPlus,
  ArrowUpRight,
  ArrowDownRight,
  IndianRupee,
  Award,
  AlertCircle,
  CheckCircle,
  DollarSign,
} from 'lucide-react';
import { apiService } from '@/lib/api-service';
import { User, Client, Product, Sale, Appointment, TeamMember } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Store metrics interface
 */
interface StoreMetrics {
  store: {
    name: string;
    revenue: {
      today: number;
      thisMonth: number;
      target: number;
      growth: number;
    };
    customers: {
      total: number;
      newToday: number;
      appointments: number;
    };
    team: {
      total: number;
      present: number;
      topPerformer: string;
    };
    inventory: {
      totalProducts: number;
      lowStock: number;
      newArrivals: number;
    };
  };
}

/**
 * Appointment interface
 */
interface AppointmentDisplay {
  id: number;
  customer: string;
  time: string;
  type: string;
  assignedTo: string;
  status: 'confirmed' | 'completed' | 'pending' | 'cancelled';
}

/**
 * Store activity interface
 */
interface StoreActivity {
  id: number;
  type: 'sale' | 'customer' | 'inventory';
  description: string;
  amount?: number;
  customer?: string;
  quantity?: number;
  employee: string;
  time: string;
}

// Local display type for team performance rows used in this component
interface TeamMemberDisplay {
  id: string;
  name: string;
  role: TeamMember['role'];
  status: TeamMember['status'];
  avatar?: string | null;
  sales: number;
  customers: number;
  target: number;
}

/**
 * Store Manager Dashboard Component
 */
export function StoreManagerDashboard() {
  const [storeMetrics, setStoreMetrics] = React.useState<StoreMetrics>({
    store: {
      name: 'Loading...',
      revenue: { today: 0, thisMonth: 0, target: 1000000, growth: 0 },
      customers: { total: 0, newToday: 0, appointments: 0 },
      team: { total: 0, present: 0, topPerformer: '' },
      inventory: { totalProducts: 0, lowStock: 0, newArrivals: 0 },
    },
  });
  const [teamPerformance, setTeamPerformance] = React.useState<TeamMemberDisplay[]>([]);
  const [todaysAppointments, setTodaysAppointments] = React.useState<AppointmentDisplay[]>([]);
  const [storeActivities, setStoreActivities] = React.useState<StoreActivity[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  
  // Business Admin Dashboard Data
  const [dashboardData, setDashboardData] = React.useState<any>(null);
  const [dashboardError, setDashboardError] = React.useState<string | null>(null);
  
  const { user, isAuthenticated, login } = useAuth();
  const router = useRouter();

  // Navigation functions for CTA buttons
  const navigateToCustomers = () => {
    router.push('/manager/customers');
  };

  const navigateToAppointments = () => {
    router.push('/manager/appointments');
  };

  const navigateToInventory = () => {
    router.push('/manager/inventory');
  };

  const navigateToTeam = () => {
    router.push('/manager/team');
  };

  const navigateToAnalytics = () => {
    router.push('/manager/analytics');
  };

  const navigateToSales = () => {
    router.push('/business-admin/sales');
  };

  const navigateToReports = () => {
    router.push('/manager/analytics');
  };

  const navigateToPipeline = () => {
    router.push('/manager/pipeline');
  };

  // Utility functions for business admin dashboard
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

  const getRoleDisplayName = () => {
    if (!user) return 'Manager';
    switch (user.role) {
      case 'manager':
        return 'Store Manager';
      case 'inhouse_sales':
        return 'Sales Representative';
      default:
        return 'Manager';
    }
  };

  const getScopeDescription = () => {
    if (!user) return 'Store-specific data';
    const storeName = (user as any)?.store_name || (user as any)?.storeName || 'Your Store';
    return `Store: ${storeName}`;
  };

  React.useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const checkAuthAndFetchData = async () => {
    try {
      if (!isAuthenticated || !user) {
        const loginSuccess = await login('rara', 'password123');
        if (loginSuccess) {
          fetchDashboardData();
        } else {
          router.push('/login');
          return;
        }
      } else {
        fetchDashboardData();
      }
    } catch (error) {
      console.error('❌ Error in auth check:', error);
      router.push('/login');
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Initialize variables
      let totalCustomers = 0;
      let newTodayCustomers = 0;
      let totalProducts = 0;
      let lowStockProducts = 0;
      let newArrivals = 0;
      let todaySales = 0;
      let monthlyRevenue = 0;
      let todaysAppointmentsData: AppointmentDisplay[] = [];
      let appointmentsCount = 0;
      
      // Initialize API response variables
      let teamResponse: any = null;
      let customersResponse: any = null;
      let productsResponse: any = null;
      let salesResponse: any = null;
      let appointmentsResponse: any = null;

      // Use authenticated user from auth hook
      const authenticatedUser = user;
      if (authenticatedUser) {
        setCurrentUser(authenticatedUser as any);
      } else {
        return;
      }

      // Fetch team members
      try {
        teamResponse = await apiService.getTeamMembers();
        if (Array.isArray(teamResponse)) {
          const teamMembers = teamResponse;
          const teamPerformanceData: TeamMemberDisplay[] = teamMembers.map((member: any) => ({
            id: String(member.id),
            name: `${member.first_name ?? member.firstName ?? ''} ${member.last_name ?? member.lastName ?? ''}`.trim(),
            role: (member.role ?? 'sales') as TeamMember['role'],
            status: 'present',
            avatar: member.avatar ?? null,
            sales: 0,
            customers: 0,
            target: 100000,
          }));
          setTeamPerformance(teamPerformanceData);
        }
      } catch (error) {
        console.error('❌ Error fetching team members:', error);
      }

      // Fetch customers
      try {
        customersResponse = await apiService.getCustomers();
        if (customersResponse.success && customersResponse.data) {
          const customers = Array.isArray(customersResponse.data) ? customersResponse.data : [];
          totalCustomers = customers.length;
          // Calculate new customers today (simplified logic)
          const today = new Date().toISOString().split('T')[0];
          newTodayCustomers = customers.filter((customer: Client) => 
            customer.created_at?.startsWith(today)
          ).length;
        }
      } catch (error) {
        console.error('❌ Error fetching customers:', error);
      }

      // Fetch products
      try {
        productsResponse = await apiService.getProducts();
        
        if (productsResponse.success && productsResponse.data) {
          // Handle different response formats like the inventory page
          let products: Product[] = [];
          if (Array.isArray(productsResponse.data)) {
            products = productsResponse.data;
          } else if (typeof productsResponse.data === 'object' && productsResponse.data !== null) {
            const data = productsResponse.data as any;
            if (data.results && Array.isArray(data.results)) {
              products = data.results;
            } else if (data.data && Array.isArray(data.data)) {
              products = data.data;
            }
          }
          
          totalProducts = products.length;
          
          lowStockProducts = products.filter((product: Product) => {
            const qty = (product as any).quantity ?? (product as any).stock_quantity ?? 0;
            const minQty = (product as any).min_quantity ?? 0;
            return qty <= minQty;
          }).length;
          
          // Calculate new arrivals (products created in last 7 days)
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          newArrivals = products.filter((product: Product) => {
            const createdAt = (product as any).created_at as string | undefined;
            if (!createdAt) return false;
            const dt = new Date(createdAt);
            return !isNaN(dt.getTime()) && dt > weekAgo;
          }).length;
        } else {
          totalProducts = 0;
          lowStockProducts = 0;
          newArrivals = 0;
        }
      } catch (error) {
        console.error('❌ Error fetching products:', error);
        // Set sample data for demonstration
        totalProducts = 0;
        lowStockProducts = 0;
        newArrivals = 0;
      }

      // Fetch sales
      try {
        // Use the new manager dashboard API that includes closed won pipelines
        const dashboardResponse = await apiService.getManagerDashboard();
        
        if (dashboardResponse.success && dashboardResponse.data) {
          const dashboardData = dashboardResponse.data;
          
          // Update revenue with combined sales + closed won pipelines
          todaySales = 0; // Today's sales would need separate calculation
          monthlyRevenue = dashboardData.monthly_revenue || 0;
        } else {
          // Fallback to old sales API
          salesResponse = await apiService.getSales();
          if (salesResponse.success && salesResponse.data) {
            const sales = Array.isArray(salesResponse.data) ? salesResponse.data : [];
            const today = new Date().toISOString().split('T')[0];
            const thisMonth = new Date().getMonth();
            const thisYear = new Date().getFullYear();
            
            todaySales = sales
              .filter((sale: Sale) => (sale as any).date?.startsWith(today))
              .reduce((sum: number, sale: Sale) => sum + ((sale as any).amount ?? 0), 0);
            
            monthlyRevenue = sales.filter((sale: Sale) => {
              const saleDate = new Date((sale as any).date);
              return saleDate.getMonth() === thisMonth && saleDate.getFullYear() === thisYear;
            }).reduce((sum: number, sale: Sale) => sum + ((sale as any).amount ?? 0), 0);
          } else {
            // Set default values when no sales data
            todaySales = 0;
            monthlyRevenue = 0;
          }
        }
      } catch (error) {
        console.error('❌ Error fetching sales:', error);
        // Set default values when no sales data
        todaySales = 0;
        monthlyRevenue = 0;
      }

      // Fetch Business Admin Dashboard Data for Manager's Store
      try {
        const businessDashboardResponse = await apiService.getDashboardStats();
        
        if (businessDashboardResponse.success && businessDashboardResponse.data) {
          setDashboardData(businessDashboardResponse.data);
        } else {
          setDashboardError('Failed to load dashboard data');
        }
      } catch (error) {
        console.error('❌ Error fetching business admin dashboard:', error);
        setDashboardError('Failed to load dashboard data');
      }

      // Fetch appointments
      try {
        appointmentsResponse = await apiService.getAppointments();
        if (appointmentsResponse.success && appointmentsResponse.data) {
          const appointments = Array.isArray(appointmentsResponse.data) ? appointmentsResponse.data : [];
          const today = new Date().toISOString().split('T')[0];

          todaysAppointmentsData = appointments
            .filter((apt: any) => {
              const dt = apt.appointment_date ? new Date(apt.appointment_date) : null;
              if (!dt || isNaN(dt.getTime())) return false;
              return dt.toISOString().split('T')[0] === today;
            })
            .map((apt: any) => ({
              id: apt.id,
              customer: apt.customer_name ? String(apt.customer_name) : `Customer ${apt.client ?? ''}`,
              time: apt.appointment_date ? new Date(apt.appointment_date).toTimeString().slice(0, 5) : String(apt.time ?? ''),
              type: String(apt.purpose ?? apt.type ?? 'appointment'),
              assignedTo: apt.assigned_to ? `User ${apt.assigned_to}` : 'Unassigned',
              status: (apt.status ?? 'pending') as 'confirmed' | 'completed' | 'pending' | 'cancelled',
            }));
          appointmentsCount = todaysAppointmentsData.length;
        }
      } catch (error) {
        console.error('❌ Error fetching appointments:', error);
      }

      // Update store metrics with the fetched data
      setStoreMetrics({
        store: {
          name: (authenticatedUser as any)?.store_name || (authenticatedUser as any)?.storeName || (authenticatedUser as any)?.first_name || 'Store Dashboard',
          revenue: { 
            today: todaySales, 
            thisMonth: monthlyRevenue, 
            target: 1000000, 
            growth: 0 
          },
          customers: { 
            total: totalCustomers, 
            newToday: newTodayCustomers, 
            appointments: appointmentsCount 
          },
          team: { 
            total: teamPerformance.length, 
            present: teamPerformance.length, 
            topPerformer: teamPerformance[0]?.name || '' 
          },
          inventory: { 
            totalProducts, 
            lowStock: lowStockProducts, 
            newArrivals 
          },
        },
      });

      setTodaysAppointments(todaysAppointmentsData);

      // Generate some sample activities
      const activities: StoreActivity[] = [
        {
          id: 1,
          type: 'sale',
          description: 'New sale completed',
          amount: todaySales,
          employee: (authenticatedUser as any)?.first_name || (authenticatedUser as any)?.firstName || 'Staff',
          time: '2 hours ago'
        },
        {
          id: 2,
          type: 'customer',
          description: 'New customer registered',
          customer: 'New Customer',
          employee: (authenticatedUser as any)?.first_name || (authenticatedUser as any)?.firstName || 'Staff',
          time: '4 hours ago'
        },
        {
          id: 3,
          type: 'inventory',
          description: 'Low stock alert',
          quantity: lowStockProducts,
          employee: 'System',
          time: '6 hours ago'
        }
      ];
      setStoreActivities(activities);

    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <DashboardLayout
      title={`${(user as any)?.store_name || (user as any)?.storeName || 'Store'} Dashboard`}
      subtitle={`${(user as any)?.store_name || (user as any)?.storeName || 'Your Store'} - Daily operations and team performance`}
      actions={
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-lg border">
            <Store className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">
              {(user as any)?.store_name || (user as any)?.storeName || 'Your Store'}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchDashboardData()}>
            <TrendingUp className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
          <Button variant="outline" size="sm" onClick={navigateToAppointments}>
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Appointment
          </Button>
          <Button size="sm" onClick={navigateToCustomers}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>
      }
    >
      {/* Business Admin Dashboard Cards - Store Specific */}
      {dashboardData && (
        <>
          {/* KPI Cards - Store Specific */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-4">
              <Store className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-text-primary">
                {(user as any)?.store_name || (user as any)?.storeName || 'Your Store'} - Key Performance Indicators
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Total Sales */}
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-secondary">Total Sales</p>
                      <p className="text-lg font-bold text-text-primary">
                        {formatCurrency(dashboardData.total_sales?.month || 0)}
                      </p>
                      <p className="text-xs text-text-secondary">
                        Today: {formatCurrency(dashboardData.total_sales?.today || 0)} | 
                        Week: {formatCurrency(dashboardData.total_sales?.week || 0)}
                      </p>
                      <p className="text-xs text-green-600 font-medium">
                        {dashboardData.total_sales?.month_count || 0} sales (includes closed won)
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Revenue in Pipeline */}
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-secondary">Revenue in Pipeline</p>
                      <p className="text-lg font-bold text-text-primary">
                        {formatCurrency(dashboardData.pipeline_revenue || 0)}
                      </p>
                      <p className="text-xs text-text-secondary">Potential revenue</p>
                      <p className="text-xs text-blue-600 font-medium">Store pending deals - revenue</p>
                    </div>
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Target className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Closed Won Pipeline */}
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-secondary">Closed Won Pipeline</p>
                      <p className="text-lg font-bold text-text-primary">
                        {formatNumber(dashboardData.closed_won_pipeline_count || 0)}
                      </p>
                      <p className="text-xs text-text-secondary">Successfully closed</p>
                      <p className="text-xs text-purple-600 font-medium">Store deal count: closed won</p>
                    </div>
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <ShoppingBag className="w-4 h-4 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* How Many in Pipeline */}
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-secondary">How Many in Pipeline</p>
                      <p className="text-lg font-bold text-text-primary">
                        {formatNumber(dashboardData.pipeline_deals_count || 0)}
                      </p>
                      <p className="text-xs text-text-secondary">Active deals</p>
                      <p className="text-xs text-orange-600 font-medium">Store deal count: pending deals</p>
                    </div>
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Store Performance - Manager's Store Only */}
          <Card className="shadow-sm mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5" />
                Store Performance - {(user as any)?.store_name || (user as any)?.storeName || 'Your Store'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboardData.store_performance?.filter((store: any) => 
                  store.name === ((user as any)?.store_name || (user as any)?.storeName)
                ).map((store: any, index: number) => (
                  <div key={store.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-text-primary">{store.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        Your Store
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-text-secondary">Total Revenue:</span>
                        <span className="font-medium text-text-primary">
                          {formatCurrency(store.revenue)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-text-secondary">Closed Won:</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(store.closed_won_revenue)}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary mt-2">
                        Store closed won - Revenue
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Store Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Sales Team Performance */}
        <CardContainer>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-foreground">Team Performance</h3>
              <p className="text-sm text-muted-foreground">Monthly sales progress by team member</p>
            </div>
            <Button variant="outline" size="sm" onClick={navigateToReports}>
              <Award className="w-4 h-4 mr-2" />
              View Reports
            </Button>
          </div>
          
          <div className="space-y-4">
            {teamPerformance.length > 0 ? (
              teamPerformance.map((member) => (
                <div key={member.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={member.avatar || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground flex items-center">
                        <IndianRupee className="w-4 h-4 mr-1" />
                        {(member.sales / 100000).toFixed(1)}L
                      </p>
                      <Badge variant={member.status === 'present' ? 'default' : 'secondary'}>
                        {member.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Target Progress</span>
                      <span className="font-medium">{((member.sales / member.target) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={(member.sales / member.target) * 100} className="h-2" />
                    <p className="text-xs text-muted-foreground">{member.customers} customers this month</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No team members found</p>
                <p className="text-sm">Team members will appear here once they are added</p>
              </div>
            )}
          </div>
        </CardContainer>

        {/* Today's Appointments */}
        <CardContainer>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-foreground">Today's Appointments</h3>
              <p className="text-sm text-muted-foreground">{todaysAppointments.length} appointments scheduled</p>
            </div>
            <Button variant="outline" size="sm" onClick={navigateToAppointments}>
              <Plus className="w-4 h-4 mr-2" />
              Add Appointment
            </Button>
          </div>

          <div className="space-y-4">
            {todaysAppointments.length > 0 ? (
              todaysAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{appointment.customer}</p>
                      <p className="text-sm text-muted-foreground">{appointment.type}</p>
                      <p className="text-xs text-muted-foreground">Assigned to: {appointment.assignedTo}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">{appointment.time}</p>
                    <Badge 
                      variant={
                        appointment.status === 'completed' ? 'default' :
                        appointment.status === 'confirmed' ? 'secondary' : 'outline'
                      }
                    >
                      {appointment.status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No appointments today</p>
                <p className="text-sm">Appointments will appear here once scheduled</p>
              </div>
            )}
          </div>
        </CardContainer>
      </div>

      {/* Store Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Monthly Target Progress */}
        <CardContainer>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Monthly Target</h3>
              <p className="text-sm text-muted-foreground">Revenue goal progress</p>
            </div>
            <Target className="w-6 h-6 text-primary" />
          </div>
          <div className="space-y-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">
                {((storeMetrics.store.revenue.thisMonth / storeMetrics.store.revenue.target) * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-muted-foreground">of monthly target</p>
            </div>
            <Progress 
              value={(storeMetrics.store.revenue.thisMonth / storeMetrics.store.revenue.target) * 100} 
              className="h-3"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>₹{(storeMetrics.store.revenue.thisMonth / 100000).toFixed(1)}L</span>
              <span>₹{(storeMetrics.store.revenue.target / 100000).toFixed(1)}L</span>
            </div>
          </div>
        </CardContainer>

        {/* Inventory Status */}
        <CardContainer>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Inventory Status</h3>
              <p className="text-sm text-muted-foreground">Store stock overview</p>
            </div>
            <Package className="w-6 h-6 text-green-500" />
          </div>
          <div className="space-y-3">
            {storeMetrics.store.inventory.totalProducts > 0 ? (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Products</span>
                  <span className="font-semibold">{storeMetrics.store.inventory.totalProducts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">New Arrivals</span>
                  <Badge variant="secondary">{storeMetrics.store.inventory.newArrivals}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Low Stock</span>
                  <Badge variant="destructive">{storeMetrics.store.inventory.lowStock}</Badge>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <Package className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">No inventory data available</p>
                <p className="text-xs text-muted-foreground mt-1">Add products to see inventory status</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={navigateToInventory}
                >
                  <Package className="w-4 h-4 mr-2" />
                  Manage Inventory
                </Button>
              </div>
            )}
          </div>
        </CardContainer>

        {/* Recent Activity */}
        <CardContainer>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
              <p className="text-sm text-muted-foreground">Latest store updates</p>
            </div>
            <Clock className="w-6 h-6 text-blue-500" />
          </div>
          <div className="space-y-3">
            {storeActivities.length > 0 ? (
              storeActivities.slice(0, 3).map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">No recent activity</p>
              </div>
            )}
          </div>
        </CardContainer>
      </div>

      {/* Quick Actions */}
      <CardContainer>
        <h3 className="text-xl font-semibold text-foreground mb-6">Quick Store Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Button variant="outline" className="h-20 flex-col space-y-2" onClick={navigateToCustomers}>
            <UserPlus className="w-5 h-5" />
            <span className="text-xs">Add Customer</span>
          </Button>
          
          <Button variant="outline" className="h-20 flex-col space-y-2" onClick={navigateToAppointments}>
            <Calendar className="w-5 h-5" />
            <span className="text-xs">Book Appointment</span>
          </Button>
          
          <Button variant="outline" className="h-20 flex-col space-y-2" onClick={navigateToInventory}>
            <Package className="w-5 h-5" />
            <span className="text-xs">Check Inventory</span>
          </Button>
          
          <Button variant="outline" className="h-20 flex-col space-y-2" onClick={navigateToTeam}>
            <Users className="w-5 h-5" />
            <span className="text-xs">Team Reports</span>
          </Button>
          
          <Button variant="outline" className="h-20 flex-col space-y-2" onClick={navigateToAnalytics}>
            <TrendingUp className="w-5 h-5" />
            <span className="text-xs">Sales Analytics</span>
          </Button>
          
          <Button variant="outline" className="h-20 flex-col space-y-2" onClick={navigateToSales}>
            <TrendingUp className="w-5 h-5" />
            <span className="text-xs">Sales Pipeline</span>
          </Button>
        </div>
      </CardContainer>
    </DashboardLayout>
  );
}