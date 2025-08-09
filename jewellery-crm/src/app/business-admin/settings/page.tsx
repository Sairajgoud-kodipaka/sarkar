'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Users, 
  Building2, 
  Globe,
  Save,
  Plus,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Shield,
  Bell,
  Loader2,
  X
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { apiService } from '@/lib/api-service';
import AddStoreModal from '@/components/stores/AddStoreModal';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Align with apiService TeamMember shape (floor displayed as string like "Floor 1")
interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'on_leave';
  avatar?: string;
  lastActive?: string;
  phone?: string;
  floor?: string | number;
  joinDate?: string;
  performance?: {
    sales: number;
    customers: number;
    rating: number;
  };
}

interface Store {
  id: string;
  name: string;
  address: string;
  phone: string;
  manager: string;
  status: 'active' | 'inactive';
}

interface Integration {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'disconnected' | 'pending';
  lastSync: string;
}

interface TeamMemberFormData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: string;
  phone: string;
  floor: number;
}

export default function SettingsPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingGeneral, setSavingGeneral] = useState(false);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  
  // Form states
  const [addFormData, setAddFormData] = useState<TeamMemberFormData>({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: '',
    phone: '',
    floor: 1
  });
  
  const [editFormData, setEditFormData] = useState<Partial<TeamMemberFormData>>({
    first_name: '',
    last_name: '',
    email: '',
    role: '',
    phone: '',
    floor: 1
  });
  
  const [submitting, setSubmitting] = useState(false);
  
  const [businessInfo, setBusinessInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    description: ''
  });

  // Stores modal state
  const [isAddStoreOpen, setIsAddStoreOpen] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    fetchData();

    // Realtime subscriptions for live updates
    const channel = supabase.channel('business-admin-settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, () => {
        fetchTeamMembersOnly();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stores' }, () => {
        fetchStoresOnly();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'business_settings' }, () => {
        fetchBusinessSettingsOnly();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await Promise.all([
        fetchBusinessSettingsOnly(),
        fetchTeamMembersOnly(),
        fetchStoresOnly(),
      ]);
      
      // For now, use mock integrations since we don't have a real integrations API
      setIntegrations([
        {
          id: '1',
          name: 'Shopify',
          type: 'E-commerce',
          status: 'connected',
          lastSync: '2 hours ago'
        },
        {
          id: '2',
          name: 'QuickBooks',
          type: 'Accounting',
          status: 'connected',
          lastSync: '1 day ago'
        },
        {
          id: '3',
          name: 'Mailchimp',
          type: 'Email Marketing',
          status: 'disconnected',
          lastSync: 'Never'
        }
      ]);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
      toast.error('Failed to load settings data');
    } finally {
      setLoading(false);
    }
  };

  const toNumberFloor = (value: string | number | undefined): number => {
    if (typeof value === 'number') return value;
    const parsed = parseInt(String(value || '').replace(/[^0-9]/g, ''), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  };

  const fetchBusinessSettingsOnly = async () => {
    try {
      const result = await apiService.getBusinessSettings();
      if (result.success && result.data) {
        const s = result.data as any;
        setBusinessInfo({
          name: s.name || '',
          email: s.email || '',
          phone: s.phone || '',
          address: s.address || '',
          website: s.website || '',
          description: s.description || '',
        });
      }
    } catch (e) {
      // ignore
    }
  };

  const fetchTeamMembersOnly = async () => {
    try {
      const teamMembersData = await apiService.getTeamMembers();
      setTeamMembers(Array.isArray(teamMembersData) ? teamMembersData : []);
    } catch (e) {
      setTeamMembers([]);
    }
  };

  const fetchStoresOnly = async () => {
    try {
      const storesResponse = await apiService.getStores();
      if (storesResponse.success) {
        setStores(storesResponse.data);
      } else {
        setStores([]);
      }
    } catch (e) {
      setStores([]);
    }
  };

  // Add member functions
  const handleAddMember = () => {
    setShowAddModal(true);
    setAddFormData({
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      role: '',
      phone: '',
      floor: 1
    });
  };

  const handleAddMemberSubmit = async () => {
    try {
      setSubmitting(true);
      
      if (!addFormData.first_name || !addFormData.last_name || !addFormData.email || !addFormData.password || !addFormData.role) {
        toast.error('Please fill in all required fields');
        return;
      }

      const response = await apiService.createTeamMember({
        first_name: addFormData.first_name,
        last_name: addFormData.last_name,
        email: addFormData.email,
        password: addFormData.password,
        role: addFormData.role,
        phone: addFormData.phone,
        floor: addFormData.floor
      });

      if (response.success) {
        toast.success('Team member added successfully');
        setShowAddModal(false);
        fetchData(); // Refresh the data
      } else {
        toast.error(response.message || 'Failed to add team member');
      }
    } catch (error) {
      console.error('Error adding team member:', error);
      toast.error('Failed to add team member');
    } finally {
      setSubmitting(false);
    }
  };

  // Edit member functions
  const handleEditMember = (member: TeamMember) => {
    setSelectedMember(member);
    setEditFormData({
      first_name: member.name.split(' ')[0] || '',
      last_name: member.name.split(' ').slice(1).join(' ') || '',
      email: member.email,
      role: member.role,
      phone: member.phone || '',
      floor: toNumberFloor(member.floor)
    });
    setShowEditModal(true);
  };

  const handleEditMemberSubmit = async () => {
    if (!selectedMember) return;

    try {
      setSubmitting(true);
      
      if (!editFormData.first_name || !editFormData.last_name || !editFormData.email || !editFormData.role) {
        toast.error('Please fill in all required fields');
        return;
      }

      const response = await apiService.updateTeamMember(selectedMember.id, {
        first_name: editFormData.first_name,
        last_name: editFormData.last_name,
        email: editFormData.email,
        role: editFormData.role,
        phone: editFormData.phone,
        floor: editFormData.floor
      });

      if (response.success) {
        toast.success('Team member updated successfully');
        setShowEditModal(false);
        setSelectedMember(null);
        fetchData(); // Refresh the data
      } else {
        toast.error(response.message || 'Failed to update team member');
      }
    } catch (error) {
      console.error('Error updating team member:', error);
      toast.error('Failed to update team member');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete member functions
  const handleDeleteMember = (member: TeamMember) => {
    setMemberToDelete(member);
    setShowDeleteDialog(true);
  };

  const handleDeleteMemberConfirm = async () => {
    if (!memberToDelete) return;

    try {
      setSubmitting(true);
      
      const response = await apiService.deleteTeamMember(memberToDelete.id);

      if (response.success) {
        toast.success('Team member deleted successfully');
        setShowDeleteDialog(false);
        setMemberToDelete(null);
        fetchData(); // Refresh the data
      } else {
        toast.error(response.message || 'Failed to delete team member');
      }
    } catch (error) {
      console.error('Error deleting team member:', error);
      toast.error('Failed to delete team member');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', text: 'Active' },
      inactive: { color: 'bg-gray-100 text-gray-800', text: 'Inactive' },
      on_leave: { color: 'bg-yellow-100 text-yellow-800', text: 'On Leave' },
      connected: { color: 'bg-green-100 text-green-800', text: 'Connected' },
      disconnected: { color: 'bg-red-100 text-red-800', text: 'Disconnected' },
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Badge className={config.color}>
        {config.text}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading settings...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchData}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-text-primary">Business Settings</h1>
        <Button className="flex items-center gap-2" onClick={async () => {
          try {
            setSavingGeneral(true);
            const resp = await apiService.upsertBusinessSettings({
              name: businessInfo.name,
              email: businessInfo.email,
              phone: businessInfo.phone,
              address: businessInfo.address,
              website: businessInfo.website,
              description: businessInfo.description,
            });
            if (resp.success) {
              toast.success('Business settings saved');
            }
          } catch (e) {
            toast.error('Failed to save business settings');
          } finally {
            setSavingGeneral(false);
          }
        }} disabled={savingGeneral}>
          <Save className="h-4 w-4" />
          {savingGeneral ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="stores">Stores</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Business Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="business-name">Business Name</Label>
                  <Input
                    id="business-name"
                    value={businessInfo.name}
                    onChange={(e) => setBusinessInfo({...businessInfo, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-email">Email Address</Label>
                  <Input
                    id="business-email"
                    type="email"
                    value={businessInfo.email}
                    onChange={(e) => setBusinessInfo({...businessInfo, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-phone">Phone Number</Label>
                  <Input
                    id="business-phone"
                    value={businessInfo.phone}
                    onChange={(e) => setBusinessInfo({...businessInfo, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-address">Address</Label>
                  <Textarea
                    id="business-address"
                    value={businessInfo.address}
                    onChange={(e) => setBusinessInfo({...businessInfo, address: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-website">Website</Label>
                  <Input
                    id="business-website"
                    value={businessInfo.website}
                    onChange={(e) => setBusinessInfo({...businessInfo, website: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-description">Description</Label>
                  <Textarea
                    id="business-description"
                    value={businessInfo.description}
                    onChange={(e) => setBusinessInfo({...businessInfo, description: e.target.value})}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Business Hours
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Monday - Friday</Label>
                    <div className="flex gap-2">
                      <Input placeholder="9:00 AM" />
                      <span className="flex items-center">to</span>
                      <Input placeholder="6:00 PM" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Saturday</Label>
                    <div className="flex gap-2">
                      <Input placeholder="10:00 AM" />
                      <span className="flex items-center">to</span>
                      <Input placeholder="5:00 PM" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Sunday</Label>
                    <div className="flex gap-2">
                      <Input placeholder="Closed" disabled />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value="inr" disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="INR (₹)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inr">INR (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tax Rate (%)</Label>
                  <Input type="number" placeholder="8.5" />
                </div>
                <div className="space-y-2">
                  <Label>Payment Methods</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch id="credit-card" defaultChecked />
                      <Label htmlFor="credit-card">Credit Card</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="cash" defaultChecked />
                      <Label htmlFor="cash">Cash</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="bank-transfer" />
                      <Label htmlFor="bank-transfer">Bank Transfer</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Members
                </CardTitle>
                <Button size="sm" onClick={handleAddMember}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="text-muted-foreground">
                          No team members found. Add your first team member to get started.
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    teamMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.avatar} />
                              <AvatarFallback>
                                {member.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{member.name}</div>
                              <div className="text-sm text-muted-foreground">{member.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{member.role}</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(member.status)}</TableCell>
                        <TableCell>{member.lastActive || 'Recently'}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditMember(member)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleDeleteMember(member)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stores" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Store Locations
                </CardTitle>
                <Button size="sm" onClick={() => setIsAddStoreOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Store
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Store Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stores.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="text-muted-foreground">
                          No stores found. Add your first store location to get started.
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    stores.map((store) => (
                      <TableRow key={store.id}>
                        <TableCell className="font-medium">{store.name}</TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate">{store.address}</div>
                        </TableCell>
                        <TableCell>{(store as any).phone || '-'}</TableCell>
                        <TableCell>{(store as any).manager_name || (store as any).manager || '-'}</TableCell>
                        <TableCell>{getStatusBadge((store as any).is_active ? 'active' : 'inactive')}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Deactivate
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Third-party Integrations
                </CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Integration
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Integration</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Sync</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {integrations.map((integration) => (
                    <TableRow key={integration.id}>
                      <TableCell className="font-medium">{integration.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{integration.type}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(integration.status)}</TableCell>
                      <TableCell>{integration.lastSync}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Configure
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Disconnect
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Email Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">New Orders</div>
                      <div className="text-sm text-muted-foreground">Get notified when new orders are placed</div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Low Inventory Alerts</div>
                      <div className="text-sm text-muted-foreground">Receive alerts when products are running low</div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Customer Support Tickets</div>
                      <div className="text-sm text-muted-foreground">Get notified of new support requests</div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">System Updates</div>
                      <div className="text-sm text-muted-foreground">Receive notifications about system maintenance</div>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">SMS Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Urgent Alerts</div>
                      <div className="text-sm text-muted-foreground">Receive SMS for critical notifications</div>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Password Policy</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Two-Factor Authentication</div>
                      <div className="text-sm text-muted-foreground">Add an extra layer of security to your account</div>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Password Expiration</div>
                      <div className="text-sm text-muted-foreground">Require password changes every 90 days</div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Session Management</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Auto Logout</div>
                      <div className="text-sm text-muted-foreground">Automatically log out after 30 minutes of inactivity</div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddStoreModal
        isOpen={isAddStoreOpen}
        onClose={() => setIsAddStoreOpen(false)}
        onSuccess={() => {
          setIsAddStoreOpen(false);
          fetchStoresOnly();
        }}
      />

      {/* Add Member Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Add a new team member to your organization.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">First Name *</Label>
                <Input
                  id="first-name"
                  value={addFormData.first_name}
                  onChange={(e) => setAddFormData({...addFormData, first_name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last Name *</Label>
                <Input
                  id="last-name"
                  value={addFormData.last_name}
                  onChange={(e) => setAddFormData({...addFormData, last_name: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={addFormData.email}
                onChange={(e) => setAddFormData({...addFormData, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={addFormData.password}
                onChange={(e) => setAddFormData({...addFormData, password: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={addFormData.role} onValueChange={(value) => setAddFormData({...addFormData, role: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="business_admin">Business Admin</SelectItem>
                  <SelectItem value="floor_manager">Floor Manager</SelectItem>
                  <SelectItem value="sales_associate">Sales Associate</SelectItem>
                  <SelectItem value="support_staff">Support Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={addFormData.phone}
                onChange={(e) => setAddFormData({...addFormData, phone: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="floor">Floor</Label>
              <Select value={addFormData.floor.toString()} onValueChange={(value) => setAddFormData({...addFormData, floor: parseInt(value)})}>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMemberSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Member Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
            <DialogDescription>
              Update team member information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-first-name">First Name *</Label>
                <Input
                  id="edit-first-name"
                  value={editFormData.first_name}
                  onChange={(e) => setEditFormData({...editFormData, first_name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-last-name">Last Name *</Label>
                <Input
                  id="edit-last-name"
                  value={editFormData.last_name}
                  onChange={(e) => setEditFormData({...editFormData, last_name: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role *</Label>
              <Select value={editFormData.role} onValueChange={(value) => setEditFormData({...editFormData, role: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="business_admin">Business Admin</SelectItem>
                  <SelectItem value="floor_manager">Floor Manager</SelectItem>
                  <SelectItem value="sales_associate">Sales Associate</SelectItem>
                  <SelectItem value="support_staff">Support Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-floor">Floor</Label>
              <Select value={editFormData.floor?.toString() || "1"} onValueChange={(value) => setEditFormData({...editFormData, floor: parseInt(value)})}>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditMemberSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Update Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the team member
              "{memberToDelete?.name}" from your organization.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteMemberConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={submitting}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
 
 