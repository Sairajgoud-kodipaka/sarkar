'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useFloor } from '@/contexts/FloorContext';
import { apiService } from '@/lib/api-service';
import { Users, TrendingUp, DollarSign, Calendar, ShoppingBag, Loader2, ChevronDown, Eye, Building } from 'lucide-react';
import { NotificationBell } from '@/components/notifications';
import { toast } from 'sonner';

interface DashboardData {
  // Visitor Statistics
  visitors: {
    today: number;
    this_week: number;
    this_month: number;
  };
  
  // Sales Statistics
  sales: {
    today: number;
    this_week: number;
    this_month: number;
  };
  
  // Walk-ins Data
  walkins: {
    total: number;
    timeFilter: 'day' | 'week' | 'month';
    data: Array<{
      id: string;
      customerName: string;
      time: string;
      status: 'active' | 'completed' | 'pending';
    }>;
  };
}

export default function FloorManagerDashboard() {
  const { user } = useAuth();
  const { currentFloor, isLoading: floorLoading, error: floorError, isFloorManager } = useFloor();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'month'>('day');

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!currentFloor) return;

      setLoading(true);
      setError(null);
      
      try {
        // Get floor number from currentFloor
        const floorNumber = parseInt(currentFloor.id);
        
        // Fetch real data from Supabase
        const response = await apiService.getFloorDashboardStats(floorNumber);
        
        if (response.success) {
          const floorData = response.data;
          setDashboardData({
            visitors: floorData.visitors,
            sales: floorData.sales,
            walkins: {
              ...floorData.walkins,
              timeFilter: 'day' as const
            }
          });
        } else {
          setError('Failed to load dashboard data');
          toast.error('Failed to load dashboard data');
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setError('Failed to load dashboard data');
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (currentFloor) {
      loadDashboardData();
    }
  }, [currentFloor]);

  // Show loading state
  if (floorLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Loading floor data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (floorError || error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{floorError || error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  // Show no access state
  if (!isFloorManager || !currentFloor) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-text-secondary">Access denied. Floor manager access required.</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-text-secondary">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">
            {currentFloor.name} Dashboard
          </h1>
          <p className="text-text-secondary mt-1">
            Floor specific data for {currentFloor.name}
          </p>
          <div className="flex items-center space-x-2 mt-2">
            <Building className="h-4 w-4 text-primary" />
            <span className="text-sm text-text-secondary">
              Manager: {currentFloor.managerName}
            </span>
            <Badge variant={currentFloor.status === 'active' ? 'default' : 'secondary'} className="text-xs">
              {currentFloor.status}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Row 1: Visitor Statistics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-text-secondary">
              How many people visited today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold text-text-primary">
                  {dashboardData.visitors.today}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-text-secondary">
              How many people visited this week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold text-text-primary">
                  {dashboardData.visitors.this_week}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-text-secondary">
              How many people visited this month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold text-text-primary">
                  {dashboardData.visitors.this_month}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Row 2: Sales Statistics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-text-secondary">
              Sales today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold text-text-primary">
                  ₹{dashboardData.sales.today.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-text-secondary">
              Sales this week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold text-text-primary">
                  ₹{dashboardData.sales.this_week.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-text-secondary">
              Sales this month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold text-text-primary">
                  ₹{dashboardData.sales.this_month.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Walk-ins Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-text-primary">
              Walkins - {currentFloor.name}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-text-secondary">Day, week, month</span>
              <Select value={timeFilter} onValueChange={(value: 'day' | 'week' | 'month') => setTimeFilter(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-secondary">Total Walk-ins: {dashboardData.walkins.total}</span>
            </div>
            
            <div className="space-y-3">
              {dashboardData.walkins.data.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-text-secondary">No walk-ins recorded today</p>
                </div>
              ) : (
                dashboardData.walkins.data.map((walkin) => (
                  <div key={walkin.id} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">{walkin.customerName}</p>
                        <p className="text-xs text-text-secondary">{walkin.time}</p>
                      </div>
                    </div>
                    <Badge 
                      variant={walkin.status === 'active' ? 'default' : 
                              walkin.status === 'completed' ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {walkin.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
