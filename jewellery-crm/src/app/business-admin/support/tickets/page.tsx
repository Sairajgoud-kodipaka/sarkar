'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Download, Eye, Loader2, Search, X, Filter, MoreHorizontal, Edit, Trash2, User, Calendar, Tag, AlertCircle, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { apiService } from '@/lib/api-service';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Ticket {
  id: string;
  title: string;
  customer: {
    name: string;
    email: string;
    avatar: string;
  };
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignedTo: string;
  createdAt: string;
  lastUpdated: string;
  description: string;
}

export default function SupportTicketsPage() {
  const router = useRouter();
  const { isAuthenticated, user, isHydrated } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingTicket, setCreatingTicket] = useState(false);
  
  // Form state for creating new ticket
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    category: 'general',
    customer_id: undefined as number | undefined,
    assigned_to: '' as string | undefined,
    floor: undefined as number | undefined,
  });

  useEffect(() => {
    if (!isHydrated) {
      return; // Wait for hydration to complete
    }
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    fetchTickets();
  }, [searchTerm, statusFilter, isAuthenticated, user, router, isHydrated]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await apiService.getSupportTickets({
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchTerm || undefined,
      });
      
      if (response.success) {
        const data = response.data as any;
        setTickets(Array.isArray(data) ? data : data.results || []);
      } else {
        setError('Failed to load support tickets');
      }
    } catch (error) {
      setError('Failed to load support tickets');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    try {
      setCreatingTicket(true);
      const ticketData = {
        ...newTicket,
      };
      const response = await apiService.createSupportTicket(ticketData);
      
      if (response.success) {
        setShowCreateModal(false);
        setNewTicket({
          title: '',
          description: '',
          priority: 'medium',
          category: 'general',
          customer_id: undefined,
          assigned_to: '',
          floor: undefined,
        });
        fetchTickets(); // Refresh the list
      } else {
        setError('Failed to create ticket');
      }
    } catch (error) {
      setError('Failed to create ticket');
    } finally {
      setCreatingTicket(false);
    }
  };

  const handleViewTicket = (ticketId: string) => {
    router.push(`/business-admin/support/tickets/${ticketId}`);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'open': { variant: 'default', className: 'bg-blue-100 text-blue-800' },
      'in_progress': { variant: 'default', className: 'bg-yellow-100 text-yellow-800' },
      'resolved': { variant: 'secondary', className: 'bg-green-100 text-green-800' },
      'closed': { variant: 'secondary', className: 'bg-gray-100 text-gray-800' },
      'reopened': { variant: 'default', className: 'bg-orange-100 text-orange-800' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open;
    
    return (
      <Badge variant={config.variant as any} className={config.className}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      'low': { variant: 'secondary', className: 'bg-gray-100 text-gray-800' },
      'medium': { variant: 'default', className: 'bg-blue-100 text-blue-800' },
      'high': { variant: 'default', className: 'bg-orange-100 text-orange-800' },
      'critical': { variant: 'destructive', className: 'bg-red-100 text-red-800' },
    };
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    
    return (
      <Badge variant={config.variant as any} className={config.className}>
        {priority}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = searchTerm === '' || 
      ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading support tickets...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchTickets}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Support Tickets</h1>
          <p className="text-text-secondary mt-1">View and manage all support tickets</p>
        </div>
        <div className="flex gap-2 items-center">
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button className="btn-primary text-sm flex items-center gap-1">
                <Plus className="w-4 h-4" /> New Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Support Ticket</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Brief description of the issue"
                    value={newTicket.title}
                    onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Detailed description of the issue"
                    rows={4}
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={newTicket.category} onValueChange={(value) => setNewTicket({ ...newTicket, category: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Inquiry</SelectItem>
                        <SelectItem value="technical">Technical Issue</SelectItem>
                        <SelectItem value="billing">Billing & Subscription</SelectItem>
                        <SelectItem value="feature_request">Feature Request</SelectItem>
                        <SelectItem value="bug_report">Bug Report</SelectItem>
                        <SelectItem value="integration">Integration Issue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Priority</Label>
                                         <Select value={newTicket.priority} onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => setNewTicket({ ...newTicket, priority: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="assigned_to">Assign To</Label>
                  <Select value={newTicket.assigned_to || ''} onValueChange={(value) => setNewTicket({ ...newTicket, assigned_to: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      <SelectItem value="user1">User 1</SelectItem>
                      <SelectItem value="user2">User 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateTicket}
                  disabled={!newTicket.title || !newTicket.description || creatingTicket}
                >
                  {creatingTicket ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Ticket'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" /> Export
          </Button>
        </div>
      </div>
      
      <Card className="p-4 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input 
              placeholder="Search by ticket ID or subject..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="reopened">Reopened</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-border bg-white mt-2">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Ticket ID</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Subject</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Status</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Priority</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Created</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'No tickets found matching your criteria.' 
                      : 'No support tickets found. Create your first ticket to get started.'}
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="border-t border-border hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-text-primary">{ticket.id}</td>
                    <td className="px-4 py-2 text-text-primary">{ticket.title}</td>
                    <td className="px-4 py-2">{getStatusBadge(ticket.status)}</td>
                    <td className="px-4 py-2">{getPriorityBadge(ticket.priority)}</td>
                                         <td className="px-4 py-2 text-text-secondary">{formatDate(ticket.createdAt)}</td>
                    <td className="px-4 py-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="View Details"
                        onClick={() => handleViewTicket(ticket.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {filteredTickets.length > 0 && (
          <div className="text-sm text-text-secondary text-center">
            Showing {filteredTickets.length} of {tickets.length} tickets
          </div>
        )}
      </Card>
    </div>
  );
}
 
 