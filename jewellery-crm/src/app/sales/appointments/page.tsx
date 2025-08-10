'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Plus, 
  Clock,
  User,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { apiService } from '@/lib/api-service';
import { toast } from 'sonner';

interface Appointment {
  id: number;
  title: string;
  customer_name: string;
  date: string;
  time: string;
  duration: number;
  type: 'consultation' | 'fitting' | 'delivery' | 'follow_up' | 'other';
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  location: string;
  notes?: string;
  created_at: string;
}

export default function SalesAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    customer_name: '',
    customer_phone: '',
    appointment_date: '',
    floor: 1,
  });

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
        const transformedAppointments: Appointment[] = response.data.map((apt: any) => {
          const appointmentDateTime = new Date(apt.appointment_date);
          return {
            id: apt.id,
            title: `Appointment with ${apt.customer_name}`,
            customer_name: apt.customer_name || 'Unknown Customer',
            date: appointmentDateTime.toISOString().split('T')[0], // YYYY-MM-DD format
            time: appointmentDateTime.toTimeString().slice(0, 5), // HH:MM format
            duration: apt.duration_minutes || 60,
            type: 'consultation' as const, // Default type
            status: apt.status || 'scheduled',
            location: `Floor ${apt.floor || 1}`,
            notes: apt.notes || '',
            created_at: apt.created_at || new Date().toISOString()
          };
        });
        
        setAppointments(transformedAppointments);
      } else {
        setAppointments([]);
      }
      
      // Mock data removed - using real API data
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to load appointments');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAppointment = async () => {
    try {
      if (!newAppointment.customer_name || !newAppointment.customer_phone || !newAppointment.appointment_date) {
        toast.error('Please fill all required fields');
        return;
      }
      const resp = await apiService.createAppointment({
        customer_name: newAppointment.customer_name,
        customer_phone: newAppointment.customer_phone,
        appointment_date: newAppointment.appointment_date,
        floor: newAppointment.floor,
      });
      if (resp.success) {
        toast.success('Appointment created');
        setIsCreateOpen(false);
        fetchAppointments();
      } else {
        toast.error(resp.message || 'Failed to create appointment');
      }
    } catch (e) {
      console.error('Create appointment error', e);
      toast.error('Failed to create appointment');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no_show': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      case 'no_show': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getTypeDisplayName = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const filteredAppointments = appointments.filter(appointment => {
    const matchesStatus = selectedStatus === 'all' || appointment.status === selectedStatus;
    const matchesDate = !selectedDate || appointment.date === selectedDate;
    return matchesStatus && matchesDate;
  });

  const today = new Date().toISOString().split('T')[0];
  const upcomingAppointments = appointments.filter(apt => apt.date >= today && apt.status !== 'cancelled');
  const completedAppointments = appointments.filter(apt => apt.status === 'completed');

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600">Manage your customer appointments</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Schedule Appointment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-blue-600">{upcomingAppointments.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedAppointments.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex gap-2">
              <Button 
                variant={selectedStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedStatus('all')}
              >
                All Status
              </Button>
              <Button 
                variant={selectedStatus === 'scheduled' ? 'default' : 'outline'}
                onClick={() => setSelectedStatus('scheduled')}
              >
                Scheduled
              </Button>
              <Button 
                variant={selectedStatus === 'confirmed' ? 'default' : 'outline'}
                onClick={() => setSelectedStatus('confirmed')}
              >
                Confirmed
              </Button>
              <Button 
                variant={selectedStatus === 'completed' ? 'default' : 'outline'}
                onClick={() => setSelectedStatus('completed')}
              >
                Completed
              </Button>
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Create Appointment Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Appointment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Customer Name</label>
              <Input value={newAppointment.customer_name} onChange={(e) => setNewAppointment({ ...newAppointment, customer_name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Customer Phone</label>
              <Input value={newAppointment.customer_phone} onChange={(e) => setNewAppointment({ ...newAppointment, customer_phone: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Date & Time</label>
              <Input type="datetime-local" value={newAppointment.appointment_date} onChange={(e) => setNewAppointment({ ...newAppointment, appointment_date: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Floor</label>
              <Input type="number" value={newAppointment.floor} onChange={(e) => setNewAppointment({ ...newAppointment, floor: Number(e.target.value) })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateAppointment}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appointments List */}
      <Card>
        <CardHeader>
          <CardTitle>Appointment List</CardTitle>
          <CardDescription>
            {filteredAppointments.length} appointments found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading appointments...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{appointment.title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          {appointment.customer_name}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {formatDate(appointment.date)} at {formatTime(appointment.time)}
                        </span>
                        <span className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {appointment.location}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Duration: {appointment.duration} min • Type: {getTypeDisplayName(appointment.type)}
                      </p>
                      {appointment.notes && (
                        <p className="text-sm text-gray-600 mt-1 italic">"{appointment.notes}"</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <Badge className={getStatusColor(appointment.status)}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(appointment.status)}
                          <span>{(appointment.status || 'scheduled').replace('_', ' ')}</span>
                        </div>
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAppointment(appointment);
                        setIsDetailsOpen(true);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
              
              {filteredAppointments.length === 0 && !loading && (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
                  <p className="text-gray-600">Try adjusting your filters or schedule a new appointment</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appointment Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
            <DialogDescription>Review appointment information</DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-3">
              <div className="font-semibold">{selectedAppointment.title}</div>
              <div className="text-sm text-gray-600">Customer: {selectedAppointment.customer_name}</div>
              <div className="text-sm text-gray-600">Date: {formatDate(selectedAppointment.date)} at {formatTime(selectedAppointment.time)}</div>
              <div className="text-sm text-gray-600">Duration: {selectedAppointment.duration} min</div>
              <div className="text-sm text-gray-600">Location: {selectedAppointment.location}</div>
              {selectedAppointment.notes && (
                <div className="text-sm text-gray-600">Notes: {selectedAppointment.notes}</div>
              )}
              <div>
                <Badge className={getStatusColor(selectedAppointment.status)}>
                  {(selectedAppointment.status || 'scheduled').replace('_', ' ')}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}