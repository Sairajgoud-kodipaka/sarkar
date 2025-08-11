'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  MessageSquare, AlertCircle, CheckCircle, Clock, Search, Plus, Filter,
  MoreHorizontal, Eye, Edit, Trash2, User, Calendar, Tag
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiService } from '@/lib/api-service';
import { supabase } from '@/lib/supabase';
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

interface SupportQuery {
  id: string;
  question: string;
  customer: string;
  category: string;
  status: 'pending' | 'answered' | 'escalated';
  createdAt: string;
}

export default function SalesSupportPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [queries, setQueries] = useState<SupportQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('tickets');
  const [stats, setStats] = useState({
    openTickets: 0,
    resolutionRate: '0%',
    totalTickets: 0
  });

  // New Ticket Modal state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    category: 'general',
    customer_id: undefined as number | undefined,
    assigned_to: '' as string | undefined,
    floor: undefined as number | undefined,
  });

  // Edit Ticket Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);

  // Assign Ticket Modal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignTicketId, setAssignTicketId] = useState<string>('');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  useEffect(() => {
    fetchSupportData();
  }, []);

  // Realtime: refresh on any support_tickets change
  useEffect(() => {
    const channel = supabase
      .channel('realtime-sales-support-tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => {
        fetchSupportData();
        toast.info('Support tickets updated in real-time!');
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_ticket_messages' }, () => {
        fetchSupportData();
        toast.info('New support message received!');
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, () => {
        fetchSupportData();
        toast.info('Team member assignments updated!');
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSupportData = async () => {
    try {
      setLoading(true);
      // Fetch support tickets
      const ticketsResponse = await apiService.getSupportTickets();
      
      if (ticketsResponse.success && ticketsResponse.data) {
        // Transform API data to match component interface
        const transformedTickets: Ticket[] = ticketsResponse.data.map((ticket: any) => ({
          id: ticket.id.toString(),
          title: ticket.title,
          description: ticket.description || ticket.summary || '',
          status: ticket.status,
          priority: ticket.priority,
          category: ticket.category || 'general',
          customer: {
            name: ticket.customer?.name || ticket.customer_name || 'Unknown Customer',
            email: ticket.customer?.email || ticket.customer_email || 'N/A',
            avatar: ''
          },
          assignedTo: ticket.assigned_to_member ? 
            `${ticket.assigned_to_member.first_name} ${ticket.assigned_to_member.last_name}` : 
            'Unassigned',
          createdAt: ticket.created_at,
          lastUpdated: ticket.updated_at,
        }));
        
        setTickets(transformedTickets);
        
        // Calculate stats
        const openTickets = transformedTickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
        const totalTickets = transformedTickets.length;
        const resolutionRate = totalTickets > 0 ? Math.round((transformedTickets.filter(t => t.status === 'resolved' || t.status === 'closed').length / totalTickets) * 100) : 0;
        
        setStats({
          openTickets,
          resolutionRate: `${resolutionRate}%`,
          totalTickets
        });
      } else {
        setTickets([]);
      }
    } catch (error) {
      console.error('Error fetching support data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openNewTicket = () => {
    setNewTicket({ 
      title: '', 
      description: '', 
      priority: 'medium', 
      category: 'general',
      customer_id: undefined,
      assigned_to: '',
      floor: undefined
    });
    setIsNewModalOpen(true);
  };

  const createTicket = async () => {
    if (!newTicket.title.trim()) return;
    try {
      const payload: any = {
        title: newTicket.title,
        description: newTicket.description,
        priority: newTicket.priority,
        category: newTicket.category,
        floor: user?.user_metadata?.floor ? Number(user.user_metadata.floor) : undefined,
      };
      await apiService.createSupportTicket(payload);
      setIsNewModalOpen(false);
      await fetchSupportData();
      toast.success('Ticket created successfully!');
    } catch (e) {
      console.error('Failed to create ticket', e);
      toast.error('Failed to create ticket');
    }
  };

  const openEdit = (t: Ticket) => {
    setEditingTicket(t);
    setIsEditModalOpen(true);
  };

  const saveEdit = async () => {
    if (!editingTicket) return;
    try {
      await apiService.updateSupportTicket(editingTicket.id, {
        title: editingTicket.title,
        description: editingTicket.description,
        status: editingTicket.status,
        priority: editingTicket.priority,
        category: editingTicket.category,
      });
      setIsEditModalOpen(false);
      setEditingTicket(null);
      await fetchSupportData();
      toast.success('Ticket updated successfully!');
    } catch (e) {
      console.error('Failed to update ticket', e);
      toast.error('Failed to update ticket');
    }
  };

  const openAssignModal = async (ticketId: string) => {
    setAssignTicketId(ticketId);
    setSelectedAssignee('');
    // Fetch team members
    try {
      const response = await apiService.getTeamMembers();
      if (response && Array.isArray(response)) {
        setTeamMembers(response);
      }
    } catch (error) {
      console.error('Failed to fetch team members:', error);
    }
    setIsAssignModalOpen(true);
  };

  const assignTicket = async () => {
    if (!selectedAssignee) return;
    try {
      await apiService.updateSupportTicket(assignTicketId, { assigned_to: selectedAssignee });
      setIsAssignModalOpen(false);
      setAssignTicketId('');
      setSelectedAssignee('');
      await fetchSupportData();
      
      // Get assigned member name for notification
      const assignedMember = teamMembers.find(m => m.id === selectedAssignee);
      const memberName = assignedMember ? `${assignedMember.first_name} ${assignedMember.last_name}` : 'Team Member';
      
      toast.success(`Ticket assigned to ${memberName}!`);
      
      // Real-time notification for assigned member
      if (supabase) {
        await supabase.from('notifications').insert({
          user_id: selectedAssignee,
          title: 'New Ticket Assignment',
          message: `You have been assigned a new support ticket: ${tickets.find(t => t.id === assignTicketId)?.title}`,
          type: 'assignment',
          read: false
        });
      }
    } catch (error) {
      console.error('Failed to assign ticket', error);
      toast.error('Failed to assign ticket');
    }
  };

  const closeTicket = async (ticketId: string) => {
    try {
      await apiService.updateSupportTicket(ticketId, { status: 'closed' });
      await fetchSupportData();
      toast.success('Ticket closed successfully!');
    } catch (error) {
      console.error('Failed to close ticket', error);
      toast.error('Failed to close ticket');
    }
  };

  const deleteTicket = async (ticketId: string) => {
    try {
      await apiService.deleteSupportTicket(ticketId);
      await fetchSupportData();
      toast.success('Ticket deleted successfully!');
    } catch (error) {
      console.error('Failed to delete ticket', error);
      toast.error('Failed to delete ticket');
    }
  };

  const handleTrashClick = (ticketId: string) => {
    closeTicket(ticketId); // First click always closes
    const recentlyClosed = sessionStorage.getItem(`recentlyClosed_${ticketId}`);
    if (recentlyClosed) {
      sessionStorage.removeItem(`recentlyClosed_${ticketId}`);
      deleteTicket(ticketId);
      toast.success('Ticket deleted successfully!');
    } else {
      sessionStorage.setItem(`recentlyClosed_${ticketId}`, 'true');
      toast.info('Ticket closed! Click the trash icon again within 3 seconds to delete it permanently.');
      setTimeout(() => {
        sessionStorage.removeItem(`recentlyClosed_${ticketId}`);
      }, 3000); // 3 second window
    }
  };

  const getStatusBadge = (status: string, ticketId?: string) => {
    const statusConfig = {
      'open': { text: 'Open', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      'in_progress': { text: 'In Progress', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      'resolved': { text: 'Resolved', color: 'bg-green-100 text-green-800 border-green-200' },
      'closed': { text: 'Closed', color: 'bg-gray-100 text-gray-800 border-gray-200' },
      'reopened': { text: 'Reopened', color: 'bg-orange-100 text-orange-800 border-orange-200' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open;
    const recentlyClosed = ticketId && sessionStorage.getItem(`recentlyClosed_${ticketId}`);
    
    return (
      <div className="flex items-center gap-2">
        <Badge className={config.color}>
          {config.text}
        </Badge>
        {recentlyClosed && (
          <Badge variant="destructive" className="text-xs bg-red-100 text-red-800 border-red-200">
            Delete Available
          </Badge>
        )}
      </div>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      'low': { variant: 'secondary', className: 'bg-gray-100 text-gray-800' },
      'medium': { variant: 'default', className: 'bg-blue-100 text-blue-800' },
      'high': { variant: 'default', className: 'bg-orange-100 text-orange-800' },
      'urgent': { variant: 'destructive', className: 'bg-red-100 text-red-800' },
    };
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    
    return (
      <Badge variant={config.variant as any} className={config.className}>
        {priority}
      </Badge>
    );
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span>Loading support data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support Center</h1>
          <p className="text-gray-600">Manage customer support and sales inquiries</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-600 font-medium">Real-time updates active</span>
          </div>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={openNewTicket}>
          <Plus className="w-4 h-4 mr-2" />
          New Ticket
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTickets}</div>
            <p className="text-xs text-muted-foreground">
              All support tickets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openTickets}</div>
            <p className="text-xs text-muted-foreground">
              Requiring attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.resolutionRate}</div>
            <p className="text-xs text-muted-foreground">
              Successfully resolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">
              Currently online
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
          <TabsTrigger value="queries">Customer Queries</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="space-y-6">
      <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Support Tickets</CardTitle>
                <div className="flex gap-2">
              <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search tickets..." className="pl-8 w-64" />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                          <span className="ml-2">Loading tickets...</span>
            </div>
                      </TableCell>
                    </TableRow>
                  ) : tickets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="text-center">
                          <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No support tickets</h3>
                          <p className="text-gray-600 mb-4">No support tickets have been created yet.</p>
                          <Button onClick={openNewTicket}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create First Ticket
              </Button>
            </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    tickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPriorityIcon(ticket.priority)}
            <div>
                            <div className="font-medium">{ticket.title}</div>
                            <div className="text-sm text-muted-foreground truncate max-w-xs">
                              {ticket.description}
            </div>
            </div>
              </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={ticket.customer.avatar} />
                            <AvatarFallback>
                              {ticket.customer.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
              <div>
                            <div className="font-medium text-sm">{ticket.customer.name}</div>
                            <div className="text-xs text-muted-foreground">{ticket.customer.email}</div>
              </div>
            </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{ticket.category}</Badge>
                      </TableCell>
                      <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                      <TableCell>{getStatusBadge(ticket.status, ticket.id)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{ticket.assignedTo}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(ticket.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { window.location.href = `/sales/support/tickets/${ticket.id}`; }}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(ticket)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Ticket
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openAssignModal(ticket.id)}>
                              <User className="mr-2 h-4 w-4" />
                              Assign to Team Member
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleTrashClick(ticket.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {sessionStorage.getItem(`recentlyClosed_${ticket.id}`) 
                                ? 'Delete Ticket' 
                                : 'Close Ticket (Click again to delete)'
                              }
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

        <TabsContent value="queries" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Customer Queries</CardTitle>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter by Status
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="text-center">
                          <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No customer queries</h3>
                          <p className="text-gray-600 mb-4">No customer queries have been submitted yet.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    queries.map((query) => (
                      <TableRow key={query.id}>
                        <TableCell>
                          <div className="max-w-md">
                            <div className="font-medium">{query.question}</div>
              </div>
                        </TableCell>
                        <TableCell className="font-medium">{query.customer}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{query.category}</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(query.status)}</TableCell>
                        <TableCell>{query.createdAt}</TableCell>
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
                                Answer Query
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Tag className="mr-2 h-4 w-4" />
                                Categorize
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

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Ticket Volume Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Chart placeholder - Ticket volume analytics will be displayed here
            </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Response Time Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Chart placeholder - Response time analytics will be displayed here
          </div>
              </CardContent>
            </Card>
            
      <Card>
        <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Order Issues</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                      </div>
                      <span className="text-sm font-medium">45%</span>
                    </div>
                  </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm">Product Issues</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '30%' }}></div>
                      </div>
                      <span className="text-sm font-medium">30%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Payment Issues</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '15%' }}></div>
                      </div>
                      <span className="text-sm font-medium">15%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Appointments</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: '10%' }}></div>
                      </div>
                      <span className="text-sm font-medium">10%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Agent Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">JS</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">John Smith</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">24 tickets</div>
                      <div className="text-xs text-muted-foreground">Avg: 2.1h response</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">LB</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">Lisa Brown</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">18 tickets</div>
                      <div className="text-xs text-muted-foreground">Avg: 1.8h response</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* New Ticket Modal */}
      <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Support Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Title" value={newTicket.title} onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })} />
            <Textarea placeholder="Description" value={newTicket.description} onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Select value={newTicket.priority} onValueChange={(v) => setNewTicket({ ...newTicket, priority: v as any })}>
                <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <Select value={newTicket.category} onValueChange={(v) => setNewTicket({ ...newTicket, category: v })}>
                <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="order">Order</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="appointments">Appointments</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewModalOpen(false)}>Cancel</Button>
            <Button onClick={createTicket} disabled={!newTicket.title.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Ticket Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Ticket</DialogTitle>
          </DialogHeader>
          {editingTicket && (
          <div className="space-y-3">
              <Input value={editingTicket.title} onChange={(e) => setEditingTicket({ ...editingTicket, title: e.target.value })} />
              <Textarea value={editingTicket.description} onChange={(e) => setEditingTicket({ ...editingTicket, description: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Select value={editingTicket.priority} onValueChange={(v) => setEditingTicket({ ...editingTicket, priority: v as 'low' | 'medium' | 'high' | 'urgent' })}>
                  <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={editingTicket.status} onValueChange={(v) => setEditingTicket({ ...editingTicket, status: v as 'open' | 'in_progress' | 'resolved' | 'closed' })}>
                  <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
            </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={!editingTicket?.title?.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Ticket Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
              <SelectTrigger><SelectValue placeholder="Select team member" /></SelectTrigger>
              <SelectContent>
                {teamMembers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.first_name} {m.last_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>Cancel</Button>
            <Button onClick={assignTicket} disabled={!selectedAssignee}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
