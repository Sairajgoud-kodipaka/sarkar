'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Search, 
  Plus, 
  Filter, 
  MoreHorizontal,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Star,
  Eye,
  Edit,
  MessageSquare
} from 'lucide-react';
import { apiService } from '@/lib/api-service';
import { useFloor } from '@/contexts/FloorContext';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select as ShSelect, SelectContent as ShSelectContent, SelectItem as ShSelectItem, SelectTrigger as ShSelectTrigger, SelectValue as ShSelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { INDIAN_STATES } from '@/constants/index';
import { Checkbox } from '@/components/ui/checkbox';

interface Customer {
  id: number;
  name: string;
  phone: string;
  interest: string;
  floor: number;
  visited_date: string;
  assigned_to?: string;
  notes?: string;
  status: 'active' | 'inactive' | 'lead' | 'prospect' | 'customer' | 'vip';
  created_at: string;
  updated_at: string;
  team_members?: {
    first_name: string;
    last_name: string;
  };
}

export default function FloorManagerCustomersPage() {
  const COMMUNITY_OPTIONS = [
    { value: 'gujarati', label: 'Gujarati' },
    { value: 'marwari', label: 'Marwari' },
    { value: 'punjabi', label: 'Punjabi' },
    { value: 'sindhi', label: 'Sindhi' },
    { value: 'bengali', label: 'Bengali' },
    { value: 'tamil', label: 'Tamil' },
    { value: 'telugu', label: 'Telugu' },
    { value: 'other', label: 'Other' },
  ];
  const { currentFloor } = useFloor();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    name: '',
    phone: '',
    email: '',
    interest: '',
    floor: 1,
    visited_date: new Date().toISOString().split('T')[0],
    status: 'lead' as Customer['status'],
    assigned_to: undefined as string | undefined,
    address: '',
    city: '',
    state: '',
    country: 'India',
    catchment_area: '',
    date_of_birth: '',
    anniversary_date: '',
    community: '',
    reason_for_visit: '',
    lead_source: '',
    age_of_end_user: '',
    saving_scheme: '',
    preferred_metal: '',
    preferred_style: '',
    preferred_occasion: '',
    budget: '',
    next_follow_up: '',
    summary_notes: '',
    notes: '',
    // interests
    interest_category: '',
    design_selected: false,
    wants_more_discount: false,
    checking_other_jewellers: false,
    felt_less_variety: false,
    other_preferences: '',
    actual_purchase_amount: '' as string | number,
  });
  const [messageText, setMessageText] = useState('');

  useEffect(() => {
    if (currentFloor) {
      fetchCustomers();
      fetchTeamMembers();
    }
  }, [currentFloor]);

  const fetchCustomers = async () => {
    if (!currentFloor) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const floorNumber = parseInt(currentFloor.id);
      const response = await apiService.getFloorCustomers(floorNumber);
      
      if (response.success) {
        setCustomers(response.data);
      } else {
        setError('Failed to load customers');
        toast.error('Failed to load customers');
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError('Failed to load customers');
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const teamMembersData = await apiService.getTeamMembers();
      // Filter to show sales team and floor managers
      const availableMembers = teamMembersData.filter((member: any) => 
        ['sales_associate', 'floor_manager', 'inhouse_sales'].includes(member.role)
      );
      setTeamMembers(availableMembers);
    } catch (error) {
      console.error('Error fetching team members:', error);
      toast.error('Failed to load team members');
    }
  };

  // If we don't have mock data anymore, we need to skip this section
  if (!currentFloor) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Loading floor information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchCustomers}>Retry</Button>
        </div>
      </div>
    );
  }

  // Replace the old mock data section with a comment
  /*
  // OLD MOCK DATA - REPLACED WITH REAL API
  const mockCustomers: Customer[] = [
        {
          id: 1,
          name: 'Priya Sharma',
          email: 'priya.sharma@email.com',
          phone: '+91 98765 43210',
          address: 'Mumbai, Maharashtra',
          preferences: {
            metal: 'Gold',
            style: 'Traditional',
            occasion: 'Wedding',
            budget: '₹50,000 - ₹1,00,000'
          },
          total_spent: 75000,
          last_visit: '2024-01-15',
          status: 'vip',
          assigned_to: 'Floor 1'
        },
        {
          id: 2,
          name: 'Rajesh Kumar',
          email: 'rajesh.kumar@email.com',
          phone: '+91 87654 32109',
          address: 'Delhi, NCR',
          preferences: {
            metal: 'Diamond',
            style: 'Modern',
            occasion: 'Anniversary',
            budget: '₹1,00,000 - ₹2,00,000'
          },
          total_spent: 150000,
          last_visit: '2024-01-10',
          status: 'active',
          assigned_to: 'Floor 1'
        },
        {
          id: 3,
          name: 'Anita Patel',
          email: 'anita.patel@email.com',
          phone: '+91 76543 21098',
          address: 'Bangalore, Karnataka',
          preferences: {
            metal: 'Platinum',
            style: 'Fusion',
            occasion: 'Festival',
            budget: '₹25,000 - ₹50,000'
          },
          total_spent: 45000,
          last_visit: '2024-01-08',
          status: 'active',
          assigned_to: 'Floor 1'
        }
  ];
  */

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
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'lead':
        return 'bg-blue-100 text-blue-800';
      case 'prospect':
        return 'bg-yellow-100 text-yellow-800';
      case 'customer':
        return 'bg-emerald-100 text-emerald-800';
      case 'vip':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm) ||
                         customer.interest.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Floor Customers</h1>
          <p className="text-gray-600">Manage customers on your floor</p>
        </div>
        <Button onClick={() => {
          setForm({
            first_name: '', last_name: '', name: '', phone: '', email: '', interest: '',
            floor: currentFloor ? parseInt(currentFloor.id) : 1,
            visited_date: new Date().toISOString().split('T')[0], status: 'lead', assigned_to: undefined,
            address: '', city: '', state: '', country: 'India', catchment_area: '',
            date_of_birth: '', anniversary_date: '', community: '',
            reason_for_visit: '', lead_source: '', age_of_end_user: '', saving_scheme: '',
            preferred_metal: '', preferred_style: '', preferred_occasion: '', budget: '',
            next_follow_up: '', summary_notes: '', notes: '',
            interest_category: '', design_selected: false, wants_more_discount: false,
            checking_other_jewellers: false, felt_less_variety: false, other_preferences: '',
            actual_purchase_amount: ''
          });
          setAddOpen(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">VIP Customers</p>
                <p className="text-2xl font-bold text-purple-600">
                  {customers.filter(c => c.status === 'vip').length}
                </p>
              </div>
              <Star className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Customers</p>
                <p className="text-2xl font-bold text-green-600">
                  {customers.filter(c => c.status === 'active').length}
                </p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recent Visits</p>
                <p className="text-2xl font-bold text-gray-900">
                  {customers.length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-orange-600" />
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
                  placeholder="Search customers..."
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
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="lead">Lead</option>
                <option value="prospect">Prospect</option>
                <option value="customer">Customer</option>
                <option value="vip">VIP</option>
              </select>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers List */}
      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredCustomers.map((customer) => (
              <div key={customer.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Phone className="w-4 h-4 mr-1" />
                          {customer.phone}
                        </span>
                        <span className="flex items-center">
                          <Star className="w-4 h-4 mr-1" />
                          {customer.interest}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          Visited: {new Date(customer.visited_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {customer.team_members 
                          ? `${customer.team_members.first_name} ${customer.team_members.last_name}`
                          : 'Unassigned'
                        }
                      </p>
                      <p className="text-sm text-gray-600">Assigned To</p>
                    </div>
                    <Badge className={getStatusColor(customer.status)}>
                      {customer.status.toUpperCase()}
                    </Badge>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => { setSelectedCustomer(customer); setViewOpen(true); }}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => {
                        setSelectedCustomer(customer);
                        const c: any = customer as any;
                        
                        // Handle name splitting if first_name/last_name are not available
                        let firstName = c.first_name || '';
                        let lastName = c.last_name || '';
                        
                        if (!firstName && !lastName && customer.name) {
                          const nameParts = customer.name.split(' ');
                          firstName = nameParts[0] || '';
                          lastName = nameParts.slice(1).join(' ') || '';
                        }
                        
                        setForm({
                          ...form,
                          first_name: firstName,
                          last_name: lastName,
                          name: customer.name || '',
                          phone: customer.phone || '',
                          email: c.email || '',
                          interest: customer.interest || '',
                          floor: customer.floor || form.floor,
                          visited_date: (c.visited_date || form.visited_date),
                          status: (customer.status as any) || form.status,
                          assigned_to: c.assigned_to || form.assigned_to,
                          address: c.address || '',
                          city: c.city || '',
                          state: c.state || '',
                          country: c.country || 'India',
                          catchment_area: c.catchment_area || '',
                          date_of_birth: c.date_of_birth || '',
                          anniversary_date: c.anniversary_date || '',
                          community: c.community || '',
                          reason_for_visit: c.reason_for_visit || '',
                          lead_source: c.lead_source || '',
                          age_of_end_user: c.age_of_end_user || '',
                          saving_scheme: c.saving_scheme || '',
                          preferred_metal: c.preferred_metal || '',
                          preferred_style: c.preferred_style || '',
                          preferred_occasion: c.preferred_occasion || '',
                          budget: c.budget || '',
                          next_follow_up: c.next_follow_up || '',
                          summary_notes: c.summary_notes || '',
                          notes: c.notes || '',
                          interest_category: '',
                          design_selected: false,
                          wants_more_discount: false,
                          checking_other_jewellers: false,
                          felt_less_variety: false,
                          other_preferences: '',
                          actual_purchase_amount: ''
                        });
                        setEditOpen(true);
                      }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { setSelectedCustomer(customer); setMessageText(''); setMessageOpen(true); }}>
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Preferred Metal:</span>
                      <p className="text-gray-900">{(customer as any).preferred_metal || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Style:</span>
                      <p className="text-gray-900">{(customer as any).preferred_style || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Occasion:</span>
                      <p className="text-gray-900">{(customer as any).preferred_occasion || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Budget:</span>
                      <p className="text-gray-900">{(customer as any).budget || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Customer Modal - Extended */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Customer / Visit</DialogTitle></DialogHeader>
          <DialogDescription>Capture customer details, visit context, preferences and optional purchase info.</DialogDescription>
          <div className="space-y-6">
            <div className="border rounded-lg p-4">
              <div className="font-semibold mb-4">Customer Details</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input placeholder="First Name *" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
                <Input placeholder="Last Name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
                <Input placeholder="Phone *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <Input placeholder="Interest (e.g., Gold Necklace) *" value={form.interest} onChange={(e) => setForm({ ...form, interest: e.target.value })} />
                <Input type="date" placeholder="Visited Date *" value={form.visited_date} onChange={(e) => setForm({ ...form, visited_date: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                <ShSelect value={form.floor != null ? String(form.floor) : undefined} onValueChange={(v: string) => setForm({ ...form, floor: parseInt(v) })}>
                  <ShSelectTrigger><ShSelectValue placeholder="Floor *" /></ShSelectTrigger>
                  <ShSelectContent>
                    <ShSelectItem value="1">Floor 1</ShSelectItem>
                    <ShSelectItem value="2">Floor 2</ShSelectItem>
                    <ShSelectItem value="3">Floor 3</ShSelectItem>
                  </ShSelectContent>
                </ShSelect>
                <ShSelect value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                  <ShSelectTrigger><ShSelectValue placeholder="Status" /></ShSelectTrigger>
                  <ShSelectContent>
                    <ShSelectItem value="lead">Lead</ShSelectItem>
                    <ShSelectItem value="prospect">Prospect</ShSelectItem>
                    <ShSelectItem value="customer">Customer</ShSelectItem>
                    <ShSelectItem value="active">Active</ShSelectItem>
                    <ShSelectItem value="inactive">Inactive</ShSelectItem>
                    <ShSelectItem value="vip">VIP</ShSelectItem>
                  </ShSelectContent>
                </ShSelect>
                <ShSelect 
                  value={form.assigned_to || ''} 
                  onValueChange={(v: string) => setForm({ ...form, assigned_to: v === 'unassigned' ? undefined : v })}

                >
                  <ShSelectTrigger><ShSelectValue placeholder="Assign To" /></ShSelectTrigger>
                  <ShSelectContent>
                    <ShSelectItem value="unassigned">Leave Unassigned</ShSelectItem>
                    {teamMembers.map((member) => (
                      <ShSelectItem key={member.id} value={member.id}>
                        {member.name || `${member.first_name || ''} ${member.last_name || ''}`.trim()}
                      </ShSelectItem>
                    ))}
                  </ShSelectContent>
                </ShSelect>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="font-semibold mb-4">Address</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input placeholder="Street Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                <Input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                <ShSelect value={form.state} onValueChange={(v: string) => setForm({ ...form, state: v })}>
                  <ShSelectTrigger><ShSelectValue placeholder="Select State" /></ShSelectTrigger>
                  <ShSelectContent>
                    {INDIAN_STATES.map((s) => (
                      <ShSelectItem key={s as string} value={s as string}>{s as string}</ShSelectItem>
                    ))}
                  </ShSelectContent>
                </ShSelect>
                <Input placeholder="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
                <Input placeholder="Catchment Area" value={form.catchment_area} onChange={(e) => setForm({ ...form, catchment_area: e.target.value })} />
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="font-semibold mb-4">Personal</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">D.O.B</label>
                  <Input type="date" placeholder="mm/dd/yyyy" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Anniversary</label>
                  <Input type="date" placeholder="mm/dd/yyyy" value={form.anniversary_date} onChange={(e) => setForm({ ...form, anniversary_date: e.target.value })} />
                </div>
                <ShSelect value={form.community} onValueChange={(v) => setForm({ ...form, community: v })}>
                  <ShSelectTrigger><ShSelectValue placeholder="Select Community" /></ShSelectTrigger>
                  <ShSelectContent>
                    {COMMUNITY_OPTIONS.map(c => (
                      <ShSelectItem key={c.value} value={c.value}>{c.label}</ShSelectItem>
                    ))}
                  </ShSelectContent>
                </ShSelect>
                {/* Mother Tongue removed as requested */}
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="font-semibold mb-4">Demographics & Visit</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ShSelect value={form.reason_for_visit} onValueChange={(v) => setForm({ ...form, reason_for_visit: v })}>
                  <ShSelectTrigger><ShSelectValue placeholder="Reason for Visit" /></ShSelectTrigger>
                  <ShSelectContent>
                    <ShSelectItem value="purchase">Purchase</ShSelectItem>
                    <ShSelectItem value="inquiry">Inquiry</ShSelectItem>
                    <ShSelectItem value="repair">Repair</ShSelectItem>
                    <ShSelectItem value="exchange">Exchange</ShSelectItem>
                    <ShSelectItem value="maintenance">Maintenance</ShSelectItem>
                    <ShSelectItem value="other">Other</ShSelectItem>
                  </ShSelectContent>
                </ShSelect>
                <ShSelect value={form.lead_source} onValueChange={(v) => setForm({ ...form, lead_source: v })}>
                  <ShSelectTrigger><ShSelectValue placeholder="Lead Source" /></ShSelectTrigger>
                  <ShSelectContent>
                    <ShSelectItem value="walkin">Walk-in</ShSelectItem>
                    <ShSelectItem value="referral">Referral</ShSelectItem>
                    <ShSelectItem value="online">Online</ShSelectItem>
                    <ShSelectItem value="social_media">Social Media</ShSelectItem>
                    <ShSelectItem value="advertisement">Advertisement</ShSelectItem>
                    <ShSelectItem value="other">Other</ShSelectItem>
                  </ShSelectContent>
                </ShSelect>
                <ShSelect value={form.age_of_end_user} onValueChange={(v) => setForm({ ...form, age_of_end_user: v })}>
                  <ShSelectTrigger><ShSelectValue placeholder="Age of End-User" /></ShSelectTrigger>
                  <ShSelectContent>
                    <ShSelectItem value="18-25">18-25</ShSelectItem>
                    <ShSelectItem value="26-35">26-35</ShSelectItem>
                    <ShSelectItem value="36-50">36-50</ShSelectItem>
                    <ShSelectItem value="51-65">51-65</ShSelectItem>
                    <ShSelectItem value="65+">65+</ShSelectItem>
                  </ShSelectContent>
                </ShSelect>
                <ShSelect value={form.saving_scheme} onValueChange={(v) => setForm({ ...form, saving_scheme: v })}>
                  <ShSelectTrigger><ShSelectValue placeholder="Saving Scheme" /></ShSelectTrigger>
              <ShSelectContent>
                <ShSelectItem value="active">Active</ShSelectItem>
                <ShSelectItem value="inactive">Inactive</ShSelectItem>
                    <ShSelectItem value="completed">Completed</ShSelectItem>
                    <ShSelectItem value="not_interested">Not Interested</ShSelectItem>
                  </ShSelectContent>
                </ShSelect>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="font-semibold mb-4">Customer Preferences</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input placeholder="Preferred Metal" value={form.preferred_metal} onChange={(e) => setForm({ ...form, preferred_metal: e.target.value })} />
                <Input placeholder="Preferred Style" value={form.preferred_style} onChange={(e) => setForm({ ...form, preferred_style: e.target.value })} />
                <Input placeholder="Occasion" value={form.preferred_occasion} onChange={(e) => setForm({ ...form, preferred_occasion: e.target.value })} />
                <Input placeholder="Budget" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
              </div>
            </div>

            {/* Customer Interests (Special Feature) */}
            <div className="border rounded-lg p-4">
              <div className="font-semibold mb-4">Customer Interests</div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Main Category *</label>
                  <ShSelect value={(form as any).interest_category} onValueChange={(v) => setForm({ ...form, interest_category: v })}>
                    <ShSelectTrigger><ShSelectValue placeholder="Select Main Category" /></ShSelectTrigger>
                    <ShSelectContent>
                      <ShSelectItem value="gold">Gold</ShSelectItem>
                      <ShSelectItem value="diamond">Diamond</ShSelectItem>
                      <ShSelectItem value="silver">Silver</ShSelectItem>
                      <ShSelectItem value="platinum">Platinum</ShSelectItem>
              </ShSelectContent>
            </ShSelect>
                </div>

                <div className="rounded-md border p-3 space-y-2 bg-white">
                  <div className="text-sm font-medium">Customer Preference</div>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={(form as any).design_selected} onCheckedChange={(v) => setForm({ ...form, design_selected: Boolean(v) })} />
                    Design Selected?
                  </label>
                  {(form as any).design_selected && (
                    <div className="rounded-md bg-emerald-50 text-emerald-800 text-sm p-3">
                      <div className="font-medium">Design Selected</div>
                      <p>This customer has selected a design. Enter the purchase amount below.</p>
                    </div>
                  )}
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={(form as any).wants_more_discount} onCheckedChange={(v) => setForm({ ...form, wants_more_discount: Boolean(v) })} />
                    Wants More Discount
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={(form as any).checking_other_jewellers} onCheckedChange={(v) => setForm({ ...form, checking_other_jewellers: Boolean(v) })} />
                    Checking Other Jewellers
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={(form as any).felt_less_variety} onCheckedChange={(v) => setForm({ ...form, felt_less_variety: Boolean(v) })} />
                    Felt Less Variety
                  </label>
                </div>

                <Input placeholder="Other Preferences (if any)" value={(form as any).other_preferences} onChange={(e) => setForm({ ...form, other_preferences: e.target.value })} />

                {(form as any).design_selected && (
                  <div className="mt-2 rounded-md bg-emerald-50 p-3">
                    <label className="block text-sm font-medium mb-1">Actual Purchase Amount (₹) *</label>
                    <Input type="number" inputMode="decimal" placeholder="e.g., 75000" value={(form as any).actual_purchase_amount as any} onChange={(e) => setForm({ ...form, actual_purchase_amount: e.target.value })} />
                    <p className="text-xs text-emerald-700 mt-1">Converted sale! This will be counted as realized revenue.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="font-semibold mb-4">Follow-up & Summary</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input type="date" placeholder="Next Follow-up Date" value={form.next_follow_up} onChange={(e) => setForm({ ...form, next_follow_up: e.target.value })} />
                <Textarea placeholder="Summary Notes of Visit" value={form.summary_notes} onChange={(e) => setForm({ ...form, summary_notes: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              try {
                if (!currentFloor) return;
                if (!(form.first_name || '').toString().trim() && !(form.name || '').toString().trim()) { toast.error('First name or full name is required'); return; }
                if (!(form.phone || '').toString().trim()) { toast.error('Phone is required'); return; }
                if (!/^\+?[0-9\s-]{10,}$/.test(((form.phone || '') as string).trim())) { toast.error('Enter a valid phone number'); return; }
                if (!(form.interest || '').toString().trim() && !(form as any).interest_category) { toast.error('Interest is required'); return; }
                if (!form.visited_date) { toast.error('Visited date is required'); return; }

                const payload: any = {
                  ...form,
                  floor: parseInt(currentFloor.id),
                  name: (form.name && form.name.trim().length > 0) ? form.name : `${form.first_name} ${form.last_name}`.trim(),
                };

                // Map special feature fields to DB-compatible columns when available
                if ((form as any).interest_category && !payload.interest) {
                  payload.interest = (form as any).interest_category;
                }
                if ((form as any).actual_purchase_amount) {
                  payload.notes = `${payload.notes ? payload.notes + '\n' : ''}Converted sale amount: ₹${(form as any).actual_purchase_amount}`;
                }

                await apiService.createCustomer(payload);
                setAddOpen(false);
                fetchCustomers();
              } catch (e) {
                toast.error('Failed to add customer');
              }
            }} disabled={!
              ((((form.first_name || '').toString().trim().length>0) || ((form.name || '').toString().trim().length>0)) &&
               ((form.phone || '').toString().trim().length>0) &&
               (((form.interest || '').toString().trim().length>0) || ((form as any).interest_category)) &&
               !!form.visited_date)
            }>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Modal – full form */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Customer</DialogTitle></DialogHeader>
          <DialogDescription>Update any of the customer details below.</DialogDescription>
          <div className="space-y-6">
            {/* Customer Details */}
            <div className="border rounded-lg p-4">
              <div className="font-semibold mb-4">Customer Details</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input placeholder="First Name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
                <Input placeholder="Last Name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
                <Input placeholder="Phone *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <Input placeholder="Interest (e.g., Gold Necklace)" value={form.interest} onChange={(e) => setForm({ ...form, interest: e.target.value })} />
                <Input type="date" placeholder="Visited Date" value={form.visited_date} onChange={(e) => setForm({ ...form, visited_date: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                <ShSelect value={form.floor != null ? String(form.floor) : undefined} onValueChange={(v: string) => setForm({ ...form, floor: parseInt(v) })}>
                  <ShSelectTrigger><ShSelectValue placeholder="Floor" /></ShSelectTrigger>
                  <ShSelectContent>
                    <ShSelectItem value="1">Floor 1</ShSelectItem>
                    <ShSelectItem value="2">Floor 2</ShSelectItem>
                    <ShSelectItem value="3">Floor 3</ShSelectItem>
                  </ShSelectContent>
                </ShSelect>
                <ShSelect value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                  <ShSelectTrigger><ShSelectValue placeholder="Status" /></ShSelectTrigger>
                  <ShSelectContent>
                    <ShSelectItem value="lead">Lead</ShSelectItem>
                    <ShSelectItem value="prospect">Prospect</ShSelectItem>
                    <ShSelectItem value="customer">Customer</ShSelectItem>
                    <ShSelectItem value="active">Active</ShSelectItem>
                    <ShSelectItem value="inactive">Inactive</ShSelectItem>
                    <ShSelectItem value="vip">VIP</ShSelectItem>
                  </ShSelectContent>
                </ShSelect>
                <ShSelect value={form.assigned_to || ''} onValueChange={(v: string) => setForm({ ...form, assigned_to: v === 'unassigned' ? undefined : v })}>
                  <ShSelectTrigger><ShSelectValue placeholder="Assign To" /></ShSelectTrigger>
                  <ShSelectContent>
                    <ShSelectItem value="unassigned">Leave Unassigned</ShSelectItem>
                    {teamMembers.map((member) => (
                      <ShSelectItem key={member.id} value={member.id}>
                        {member.name || `${member.first_name || ''} ${member.last_name || ''}`.trim()}
                      </ShSelectItem>
                    ))}
                  </ShSelectContent>
                </ShSelect>
              </div>
            </div>

            {/* Address */}
            <div className="border rounded-lg p-4">
              <div className="font-semibold mb-4">Address</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input placeholder="Street Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                <Input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                <ShSelect value={form.state} onValueChange={(v: string) => setForm({ ...form, state: v })}>
                  <ShSelectTrigger><ShSelectValue placeholder="Select State" /></ShSelectTrigger>
                  <ShSelectContent>
                    {INDIAN_STATES.map((s) => (
                      <ShSelectItem key={s as string} value={s as string}>{s as string}</ShSelectItem>
                    ))}
                  </ShSelectContent>
                </ShSelect>
                <Input placeholder="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
                <Input placeholder="Catchment Area" value={form.catchment_area} onChange={(e) => setForm({ ...form, catchment_area: e.target.value })} />
              </div>
            </div>

            {/* Personal */}
            <div className="border rounded-lg p-4">
              <div className="font-semibold mb-4">Personal</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">D.O.B</label>
                  <Input type="date" placeholder="mm/dd/yyyy" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Anniversary</label>
                  <Input type="date" placeholder="mm/dd/yyyy" value={form.anniversary_date} onChange={(e) => setForm({ ...form, anniversary_date: e.target.value })} />
                </div>
                <ShSelect value={form.community} onValueChange={(v) => setForm({ ...form, community: v })}>
                  <ShSelectTrigger><ShSelectValue placeholder="Select Community" /></ShSelectTrigger>
                  <ShSelectContent>
                    {COMMUNITY_OPTIONS.map(c => (
                      <ShSelectItem key={c.value} value={c.value}>{c.label}</ShSelectItem>
                    ))}
                  </ShSelectContent>
                </ShSelect>
              </div>
            </div>

            {/* Demographics & Visit */}
            <div className="border rounded-lg p-4">
              <div className="font-semibold mb-4">Demographics & Visit</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ShSelect value={form.reason_for_visit} onValueChange={(v) => setForm({ ...form, reason_for_visit: v })}>
                  <ShSelectTrigger><ShSelectValue placeholder="Reason for Visit" /></ShSelectTrigger>
                  <ShSelectContent>
                    <ShSelectItem value="purchase">Purchase</ShSelectItem>
                    <ShSelectItem value="inquiry">Inquiry</ShSelectItem>
                    <ShSelectItem value="repair">Repair</ShSelectItem>
                    <ShSelectItem value="exchange">Exchange</ShSelectItem>
                    <ShSelectItem value="maintenance">Maintenance</ShSelectItem>
                    <ShSelectItem value="other">Other</ShSelectItem>
                  </ShSelectContent>
                </ShSelect>
                <ShSelect value={form.lead_source} onValueChange={(v) => setForm({ ...form, lead_source: v })}>
                  <ShSelectTrigger><ShSelectValue placeholder="Lead Source" /></ShSelectTrigger>
                  <ShSelectContent>
                    <ShSelectItem value="walkin">Walk-in</ShSelectItem>
                    <ShSelectItem value="referral">Referral</ShSelectItem>
                    <ShSelectItem value="online">Online</ShSelectItem>
                    <ShSelectItem value="social_media">Social Media</ShSelectItem>
                    <ShSelectItem value="advertisement">Advertisement</ShSelectItem>
                    <ShSelectItem value="other">Other</ShSelectItem>
                  </ShSelectContent>
                </ShSelect>
                <ShSelect value={form.age_of_end_user} onValueChange={(v) => setForm({ ...form, age_of_end_user: v })}>
                  <ShSelectTrigger><ShSelectValue placeholder="Age of End-User" /></ShSelectTrigger>
                  <ShSelectContent>
                    <ShSelectItem value="18-25">18-25</ShSelectItem>
                    <ShSelectItem value="26-35">26-35</ShSelectItem>
                    <ShSelectItem value="36-50">36-50</ShSelectItem>
                    <ShSelectItem value="51-65">51-65</ShSelectItem>
                    <ShSelectItem value="65+">65+</ShSelectItem>
                  </ShSelectContent>
                </ShSelect>
                <ShSelect value={form.saving_scheme} onValueChange={(v) => setForm({ ...form, saving_scheme: v })}>
                  <ShSelectTrigger><ShSelectValue placeholder="Saving Scheme" /></ShSelectTrigger>
              <ShSelectContent>
                <ShSelectItem value="active">Active</ShSelectItem>
                <ShSelectItem value="inactive">Inactive</ShSelectItem>
                    <ShSelectItem value="completed">Completed</ShSelectItem>
                    <ShSelectItem value="not_interested">Not Interested</ShSelectItem>
              </ShSelectContent>
            </ShSelect>
              </div>
            </div>

            {/* Customer Preferences */}
            <div className="border rounded-lg p-4">
              <div className="font-semibold mb-4">Customer Preferences</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input placeholder="Preferred Metal" value={form.preferred_metal} onChange={(e) => setForm({ ...form, preferred_metal: e.target.value })} />
                <Input placeholder="Preferred Style" value={form.preferred_style} onChange={(e) => setForm({ ...form, preferred_style: e.target.value })} />
                <Input placeholder="Occasion" value={form.preferred_occasion} onChange={(e) => setForm({ ...form, preferred_occasion: e.target.value })} />
                <Input placeholder="Budget" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
              </div>
            </div>

            {/* Follow-up & Summary */}
            <div className="border rounded-lg p-4">
              <div className="font-semibold mb-4">Follow-up & Summary</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input type="date" placeholder="Next Follow-up Date" value={form.next_follow_up} onChange={(e) => setForm({ ...form, next_follow_up: e.target.value })} />
                <Textarea placeholder="Summary Notes of Visit" value={form.summary_notes} onChange={(e) => setForm({ ...form, summary_notes: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              try {
                if (!selectedCustomer) return;
                const payload: any = { ...form };
                // Compose full name if first/last provided
                const composed = `${(form.first_name || '').toString().trim()} ${(form.last_name || '').toString().trim()}`.trim();
                if (composed) payload.name = composed;
                if (!(payload.interest || '').toString().trim() && (form as any).interest_category) {
                  payload.interest = (form as any).interest_category;
                }
                // Remove local-only interest helper fields
                delete payload.interest_category;
                delete payload.design_selected;
                delete payload.wants_more_discount;
                delete payload.checking_other_jewellers;
                delete payload.felt_less_variety;
                delete payload.other_preferences;
                delete payload.actual_purchase_amount;

                await apiService.updateCustomer(selectedCustomer.id, payload);
                setEditOpen(false);
                setSelectedCustomer(null);
                fetchCustomers();
              } catch (e) {
                toast.error('Failed to update customer');
              }
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Customer Modal */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-md w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Customer Details</DialogTitle></DialogHeader>
          <div className="space-y-2 text-sm">
            <div><span className="text-gray-600">Name:</span> {selectedCustomer?.name}</div>
            <div><span className="text-gray-600">Phone:</span> {selectedCustomer?.phone}</div>
            <div><span className="text-gray-600">Interest:</span> {selectedCustomer?.interest}</div>
            <div><span className="text-gray-600">Visited:</span> {selectedCustomer ? new Date(selectedCustomer.visited_date).toLocaleDateString() : ''}</div>
            <div><span className="text-gray-600">Status:</span> {selectedCustomer?.status}</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Message Modal (stores to notes) */}
      <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
        <DialogContent className="max-w-md w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Send Message</DialogTitle></DialogHeader>
          <Textarea placeholder="Type your message..." value={messageText} onChange={(e) => setMessageText(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              try {
                if (!selectedCustomer) return;
                const updatedNotes = `${selectedCustomer.notes ? selectedCustomer.notes + '\n' : ''}${new Date().toLocaleString()}: ${messageText}`;
                await apiService.updateCustomer(selectedCustomer.id, { notes: updatedNotes });
                setMessageOpen(false);
                setSelectedCustomer(null);
                setMessageText('');
                fetchCustomers();
              } catch (e) {
                toast.error('Failed to save message');
              }
            }} disabled={!messageText.trim()}>Send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
