'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, Clock, Users, Search, Plus, Phone, Mail, MapPin, 
  CheckCircle, XCircle, AlertCircle, Eye, Edit, Trash2, UserCheck, CalendarX 
} from 'lucide-react';
import { apiService } from '@/lib/api-service';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Appointment {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  appointment_date: string;
  appointment_time: string;
  duration: number;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  assigned_to: string;
  assigned_to_id?: string;
  floor: string;
  notes: string;
}

export default function FunctionalAppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    appointment_date: '',
    appointment_time: '',
    duration: 60,
    assigned_to: '',
    floor: 1,
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch appointments and team members
      const [appointmentsResponse, teamResponse] = await Promise.all([
        apiService.getAppointments(),
        apiService.getTeamMembers()
      ]);
      
      if (appointmentsResponse.success && appointmentsResponse.data) {
        const transformedAppointments: Appointment[] = appointmentsResponse.data.map((apt: any) => {
          const appointmentDateTime = new Date(apt.appointment_date);
          return {
            id: apt.id,
            customer_name: apt.customer_name || 'Unknown Customer',
            customer_email: apt.customer_email || '',
            customer_phone: apt.customer_phone || '',
            appointment_date: appointmentDateTime.toISOString().split('T')[0],
            appointment_time: appointmentDateTime.toTimeString().slice(0, 5),
            duration: apt.duration_minutes || 60,
            status: apt.status || 'scheduled',
            assigned_to: apt.assigned_to_member ? 
              `${apt.assigned_to_member.first_name} ${apt.assigned_to_member.last_name}` : 
              'Unassigned',
            assigned_to_id: apt.assigned_to,
            floor: apt.floor?.toString() || '1',
            notes: apt.notes || ''
          };
        });
        setAppointments(transformedAppointments);
      }

      // teamResponse is already an array, not an API response object
      if (Array.isArray(teamResponse)) {
        setTeamMembers(teamResponse);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      customer_name: '',
      customer_phone: '',
      customer_email: '',
      appointment_date: '',
      appointment_time: '',
      duration: 60,
      assigned_to: '',
      floor: 1,
      notes: ''
    });
  };

  const handleCreateAppointment = async () => {
    try {
      if (!formData.customer_name || !formData.customer_phone || !formData.appointment_date || !formData.appointment_time) {
        toast.error('Please fill in all required fields');
        return;
      }

      const appointmentDateTime = new Date(`${formData.appointment_date}T${formData.appointment_time}`);
      
      const response = await apiService.createAppointment({
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_email: formData.customer_email,
        appointment_date: appointmentDateTime.toISOString(),
        duration_minutes: formData.duration,
        assigned_to: formData.assigned_to || user?.id,
        floor: formData.floor,
        status: 'scheduled',
        notes: formData.notes
      });

      if (response.success) {
        toast.success('Appointment created successfully!');
        setShowAddModal(false);
        resetForm();
        fetchData();
      } else {
        toast.error('Failed to create appointment');
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast.error('Failed to create appointment');
    }
  };

  const handleUpdateAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      const appointmentDateTime = new Date(`${formData.appointment_date}T${formData.appointment_time}`);
      
      const response = await apiService.updateAppointment(selectedAppointment.id, {
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_email: formData.customer_email,
        appointment_date: appointmentDateTime.toISOString(),
        duration_minutes: formData.duration,
        assigned_to: formData.assigned_to,
        floor: formData.floor,
        notes: formData.notes
      });

      if (response.success) {
        toast.success('Appointment updated successfully!');
        setShowEditModal(false);
        setSelectedAppointment(null);
        resetForm();
        fetchData();
      } else {
        toast.error('Failed to update appointment');
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error('Failed to update appointment');
    }
  };

  const handleDeleteAppointment = async (id: number) => {
    if (!confirm('Are you sure you want to delete this appointment?')) return;

    try {
      const response = await apiService.deleteAppointment(id);
      
      if (response.success) {
        toast.success('Appointment deleted successfully!');
        fetchData();
      } else {
        toast.error('Failed to delete appointment');
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast.error('Failed to delete appointment');
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      const response = await apiService.updateAppointmentStatus(id, newStatus);
      
      if (response.success) {
        toast.success(`Appointment ${newStatus}!`);
        fetchData();
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const openEditModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setFormData({
      customer_name: appointment.customer_name,
      customer_phone: appointment.customer_phone,
      customer_email: appointment.customer_email,
      appointment_date: appointment.appointment_date,
      appointment_time: appointment.appointment_time,
      duration: appointment.duration,
      assigned_to: appointment.assigned_to_id || '',
      floor: parseInt(appointment.floor),
      notes: appointment.notes
    });
    setShowEditModal(true);
  };

  const openViewModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowViewModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no_show': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Calendar className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'in_progress': return <Clock className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      case 'no_show': return <AlertCircle className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = appointment.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.customer_phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600 mt-1">Manage customer appointments and schedules</p>
        </div>
        <Button 
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Appointment
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search appointments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="no_show">No Show</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">{filteredAppointments.length} appointments</span>
        </div>
      </div>

      {/* Appointments List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredAppointments.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No appointments found</p>
                <Button 
                  onClick={() => setShowAddModal(true)}
                  className="mt-4"
                  variant="outline"
                >
                  Create First Appointment
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredAppointments.map((appointment) => (
            <Card key={appointment.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{appointment.customer_name}</CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(appointment.appointment_date), 'MMM dd, yyyy')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {appointment.appointment_time}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        Floor {appointment.floor}
                      </div>
                    </div>
                  </div>
                  <Badge className={getStatusColor(appointment.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(appointment.status)}
                      {appointment.status.replace('_', ' ').toUpperCase()}
                    </div>
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span>{appointment.customer_phone}</span>
                  </div>
                  
                  {appointment.customer_email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span>{appointment.customer_email}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm">
                    <UserCheck className="w-4 h-4 text-gray-500" />
                    <span>Assigned to: {appointment.assigned_to}</span>
                  </div>

                  {appointment.notes && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      <strong>Notes:</strong> {appointment.notes}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openViewModal(appointment)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(appointment)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Button>

                    {appointment.status === 'scheduled' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(appointment.id, 'confirmed')}
                        className="flex items-center gap-1 text-green-600 hover:bg-green-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Confirm
                      </Button>
                    )}

                    {appointment.status === 'confirmed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(appointment.id, 'in_progress')}
                        className="flex items-center gap-1 text-blue-600 hover:bg-blue-50"
                      >
                        <Clock className="w-4 h-4" />
                        Start
                      </Button>
                    )}

                    {appointment.status === 'in_progress' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(appointment.id, 'completed')}
                        className="flex items-center gap-1 text-emerald-600 hover:bg-emerald-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Complete
                      </Button>
                    )}

                    {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                        className="flex items-center gap-1 text-red-600 hover:bg-red-50"
                      >
                        <CalendarX className="w-4 h-4" />
                        Cancel
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteAppointment(appointment.id)}
                      className="flex items-center gap-1 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Appointment Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Appointment</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="customer_name">Customer Name *</Label>
              <Input
                id="customer_name"
                value={formData.customer_name}
                onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                placeholder="Enter customer name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customer_phone">Phone Number *</Label>
              <Input
                id="customer_phone"
                value={formData.customer_phone}
                onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                placeholder="Enter phone number"
              />
            </div>
            
            <div className="space-y-2 col-span-2">
              <Label htmlFor="customer_email">Email</Label>
              <Input
                id="customer_email"
                type="email"
                value={formData.customer_email}
                onChange={(e) => setFormData({...formData, customer_email: e.target.value})}
                placeholder="Enter email address"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="appointment_date">Date *</Label>
              <Input
                id="appointment_date"
                type="date"
                value={formData.appointment_date}
                onChange={(e) => setFormData({...formData, appointment_date: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="appointment_time">Time *</Label>
              <Input
                id="appointment_time"
                type="time"
                value={formData.appointment_time}
                onChange={(e) => setFormData({...formData, appointment_time: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Select value={formData.duration.toString()} onValueChange={(value) => setFormData({...formData, duration: parseInt(value)})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="floor">Floor</Label>
              <Select value={formData.floor.toString()} onValueChange={(value) => setFormData({...formData, floor: parseInt(value)})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Floor 1</SelectItem>
                  <SelectItem value="2">Floor 2</SelectItem>
                  <SelectItem value="3">Floor 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 col-span-2">
              <Label htmlFor="assigned_to">Assign To</Label>
              <Select value={formData.assigned_to} onValueChange={(value) => setFormData({...formData, assigned_to: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.first_name} {member.last_name} ({member.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Enter any additional notes"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAppointment}>
              Create Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Appointment Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Appointment</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_customer_name">Customer Name *</Label>
              <Input
                id="edit_customer_name"
                value={formData.customer_name}
                onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                placeholder="Enter customer name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit_customer_phone">Phone Number *</Label>
              <Input
                id="edit_customer_phone"
                value={formData.customer_phone}
                onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                placeholder="Enter phone number"
              />
            </div>
            
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit_customer_email">Email</Label>
              <Input
                id="edit_customer_email"
                type="email"
                value={formData.customer_email}
                onChange={(e) => setFormData({...formData, customer_email: e.target.value})}
                placeholder="Enter email address"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit_appointment_date">Date *</Label>
              <Input
                id="edit_appointment_date"
                type="date"
                value={formData.appointment_date}
                onChange={(e) => setFormData({...formData, appointment_date: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit_appointment_time">Time *</Label>
              <Input
                id="edit_appointment_time"
                type="time"
                value={formData.appointment_time}
                onChange={(e) => setFormData({...formData, appointment_time: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit_duration">Duration (minutes)</Label>
              <Select value={formData.duration.toString()} onValueChange={(value) => setFormData({...formData, duration: parseInt(value)})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit_floor">Floor</Label>
              <Select value={formData.floor.toString()} onValueChange={(value) => setFormData({...formData, floor: parseInt(value)})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Floor 1</SelectItem>
                  <SelectItem value="2">Floor 2</SelectItem>
                  <SelectItem value="3">Floor 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit_assigned_to">Assign To</Label>
              <Select value={formData.assigned_to} onValueChange={(value) => setFormData({...formData, assigned_to: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.first_name} {member.last_name} ({member.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit_notes">Notes</Label>
              <Textarea
                id="edit_notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Enter any additional notes"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAppointment}>
              Update Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Appointment Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          
          {selectedAppointment && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Customer Name</Label>
                  <p className="text-lg font-semibold">{selectedAppointment.customer_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(selectedAppointment.status)}>
                      {selectedAppointment.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Phone</Label>
                  <p>{selectedAppointment.customer_phone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Email</Label>
                  <p>{selectedAppointment.customer_email || 'Not provided'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Date</Label>
                  <p>{format(new Date(selectedAppointment.appointment_date), 'MMMM dd, yyyy')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Time</Label>
                  <p>{selectedAppointment.appointment_time}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Duration</Label>
                  <p>{selectedAppointment.duration} minutes</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Assigned To</Label>
                  <p>{selectedAppointment.assigned_to}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Floor</Label>
                  <p>Floor {selectedAppointment.floor}</p>
                </div>
              </div>
              
              {selectedAppointment.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Notes</Label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-lg">{selectedAppointment.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewModal(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setShowViewModal(false);
              if (selectedAppointment) openEditModal(selectedAppointment);
            }}>
              Edit Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
