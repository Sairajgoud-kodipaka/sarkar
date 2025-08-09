'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Calendar, 
  Clock, 
  Users, 
  Search, 
  Plus, 
  Filter,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  MessageSquare
} from 'lucide-react';
import { apiService } from '@/lib/api-service';

interface Appointment {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  appointment_date: string;
  appointment_time: string;
  duration: number;
  type: 'consultation' | 'delivery' | 'fitting' | 'follow_up';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  assigned_to: string;
  floor: string;
  notes: string;
  total_value?: number;
}

export default function FloorManagerAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      // Load real appointments from database
      const response = await apiService.getAppointments();
      
      if (response.success && response.data) {
        // Transform API data to match component interface
        const transformedAppointments: Appointment[] = response.data.map((apt: any) => ({
          id: apt.id,
          customer_name: apt.customer_name,
          customer_phone: apt.customer_phone,
          appointment_date: apt.appointment_date,
          duration: apt.duration_minutes || 60,
          status: apt.status,
          service_type: 'Consultation', // Default value
          notes: apt.notes || '',
          assigned_staff: apt.assigned_to_member ? 
            `${apt.assigned_to_member.first_name} ${apt.assigned_to_member.last_name}` : 
            'Unassigned'
        }));
        
        setAppointments(transformedAppointments);
      } else {
        setAppointments([]);
      }
      
      /* OLD MOCK DATA - REPLACED WITH REAL API
      const mockAppointments: Appointment[] = [
        {
          id: 1,
          customer_name: 'Priya Sharma',
          customer_email: 'priya.sharma@email.com',
          customer_phone: '+91 98765 43210',
          appointment_date: '2024-01-20',
          appointment_time: '10:00 AM',
          duration: 60,
          type: 'consultation',
          status: 'confirmed',
          assigned_to: 'Floor 1 Manager',
          floor: 'Floor 1',
          notes: 'Interested in gold necklace collection',
          total_value: 75000
        },
        {
          id: 2,
          customer_name: 'Rajesh Kumar',
          customer_email: 'rajesh.kumar@email.com',
          customer_phone: '+91 87654 32109',
          appointment_date: '2024-01-20',
          appointment_time: '2:00 PM',
          duration: 90,
          type: 'fitting',
          status: 'scheduled',
          assigned_to: 'Floor 1 Manager',
          floor: 'Floor 1',
          notes: 'Diamond ring fitting for anniversary',
          total_value: 150000
        },
        {
          id: 3,
          customer_name: 'Anita Patel',
          customer_email: 'anita.patel@email.com',
          customer_phone: '+91 76543 21098',
          appointment_date: '2024-01-21',
          appointment_time: '11:30 AM',
          duration: 45,
          type: 'delivery',
          status: 'scheduled',
          assigned_to: 'Floor 1 Manager',
          floor: 'Floor 1',
          notes: 'Platinum earrings delivery',
          total_value: 45000
        },
        {
          id: 4,
          customer_name: 'Sunita Verma',
          customer_email: 'sunita.verma@email.com',
          customer_phone: '+91 65432 10987',
          appointment_date: '2024-01-19',
          appointment_time: '3:00 PM',
          duration: 60,
          type: 'follow_up',
          status: 'completed',
          assigned_to: 'Floor 1 Manager',
          floor: 'Floor 1',
          notes: 'Follow up on wedding collection',
          total_value: 200000
        }
      ];
      */ // End of commented mock data
    } catch (error) {
      console.error('Error fetching appointments:', error);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no_show':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'consultation':
        return 'bg-blue-100 text-blue-800';
      case 'fitting':
        return 'bg-green-100 text-green-800';
      case 'delivery':
        return 'bg-purple-100 text-purple-800';
      case 'follow_up':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = appointment.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.customer_phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
    const matchesType = typeFilter === 'all' || appointment.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const todayAppointments = appointments.filter(a => a.appointment_date === '2024-01-20');
  const upcomingAppointments = appointments.filter(a => a.appointment_date > '2024-01-20');
  const completedAppointments = appointments.filter(a => a.status === 'completed');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Floor Appointments</h1>
          <p className="text-gray-600">Manage appointments on your floor</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Book Appointment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
                <p className="text-2xl font-bold text-blue-600">{todayAppointments.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-green-600">{upcomingAppointments.length}</p>
              </div>
              <Clock className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-purple-600">{completedAppointments.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(appointments.reduce((sum, a) => sum + (a.total_value || 0), 0))}
                </p>
              </div>
              <Users className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search appointments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No Show</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="consultation">Consultation</option>
                <option value="fitting">Fitting</option>
                <option value="delivery">Delivery</option>
                <option value="follow_up">Follow Up</option>
              </select>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <Card>
        <CardHeader>
          <CardTitle>Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => (
              <div key={appointment.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{appointment.customer_name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {appointment.appointment_date} at {appointment.appointment_time}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {appointment.duration} min
                        </span>
                        <span className="flex items-center">
                          <Mail className="w-4 h-4 mr-1" />
                          {appointment.customer_email}
                        </span>
                        <span className="flex items-center">
                          <Phone className="w-4 h-4 mr-1" />
                          {appointment.customer_phone}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {appointment.total_value && (
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(appointment.total_value)}
                        </p>
                        <p className="text-sm text-gray-600">Value</p>
                      </div>
                    )}
                    <Badge className={getTypeColor(appointment.type)}>
                      {appointment.type.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <Badge className={getStatusColor(appointment.status)}>
                      {appointment.status.toUpperCase()}
                    </Badge>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {appointment.notes && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Notes:</span> {appointment.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
