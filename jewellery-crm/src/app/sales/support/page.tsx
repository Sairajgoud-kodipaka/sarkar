'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  MessageSquare, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Search, 
  Plus, 
  Filter,
  Phone,
  Mail,
  User,
  Calendar,
  Eye,
  Edit,
  Reply
} from 'lucide-react';
import { apiService } from '@/lib/api-service';

interface SupportTicket {
  id: number;
  ticket_number: string;
  subject: string;
  description: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  created_date: string;
  updated_date: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  category: 'technical' | 'billing' | 'product' | 'general';
  assigned_to: string;
  floor: string;
  response_time?: string;
}

export default function SalesSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      // Load real support tickets from database
      const response = await apiService.getSupportTickets();
      
      if (response.success && response.data) {
        // Transform API data to match component interface
        const transformedTickets: SupportTicket[] = response.data.map((ticket: any) => ({
          id: ticket.id,
          title: ticket.title,
          description: ticket.description,
          status: ticket.status,
          priority: ticket.priority,
          category: ticket.category || 'general',
          customer_name: ticket.customer?.name || ticket.customer_name || 'Unknown Customer',
          customer_email: ticket.customer?.email || '',
          customer_phone: ticket.customer?.phone || '',
          assigned_to: ticket.assigned_to_member ? 
            `${ticket.assigned_to_member.first_name} ${ticket.assigned_to_member.last_name}` : 
            'Unassigned',
          created_at: ticket.created_at,
          updated_at: ticket.updated_at
        }));
        
        setTickets(transformedTickets);
      } else {
        setTickets([]);
      }
      
      /* OLD MOCK DATA - REPLACED WITH REAL API
      const mockTickets: SupportTicket[] = [
        {
          id: 1,
          ticket_number: 'TKT-2024-001',
          subject: 'Product Information Request',
          description: 'Customer needs detailed information about gold necklace collection',
          customer_name: 'Priya Sharma',
          customer_email: 'priya.sharma@email.com',
          customer_phone: '+91 98765 43210',
          created_date: '2024-01-15',
          updated_date: '2024-01-16',
          priority: 'medium',
          status: 'in_progress',
          category: 'product',
          assigned_to: 'Sales Team',
          floor: 'Floor 1',
          response_time: '2 hours'
        },
        {
          id: 2,
          ticket_number: 'TKT-2024-002',
          subject: 'Payment Issue',
          description: 'Customer facing payment gateway error during checkout',
          customer_name: 'Rajesh Kumar',
          customer_email: 'rajesh.kumar@email.com',
          customer_phone: '+91 87654 32109',
          created_date: '2024-01-16',
          updated_date: '2024-01-16',
          priority: 'high',
          status: 'open',
          category: 'technical',
          assigned_to: 'Sales Team',
          floor: 'Floor 1',
          response_time: '1 hour'
        },
        {
          id: 3,
          ticket_number: 'TKT-2024-003',
          subject: 'Order Status Update',
          description: 'Customer wants to know delivery status of their order',
          customer_name: 'Anita Patel',
          customer_email: 'anita.patel@email.com',
          customer_phone: '+91 76543 21098',
          created_date: '2024-01-17',
          updated_date: '2024-01-17',
          priority: 'low',
          status: 'resolved',
          category: 'general',
          assigned_to: 'Sales Team',
          floor: 'Floor 1',
          response_time: '30 minutes'
        },
        {
          id: 4,
          ticket_number: 'TKT-2024-004',
          subject: 'Billing Query',
          description: 'Customer has questions about invoice and payment terms',
          customer_name: 'Sunita Verma',
          customer_email: 'sunita.verma@email.com',
          customer_phone: '+91 65432 10987',
          created_date: '2024-01-18',
          updated_date: '2024-01-18',
          priority: 'medium',
          status: 'open',
          category: 'billing',
          assigned_to: 'Sales Team',
          floor: 'Floor 1'
        }
      ];
      */ // End of commented mock data
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technical':
        return 'bg-purple-100 text-purple-800';
      case 'billing':
        return 'bg-blue-100 text-blue-800';
      case 'product':
        return 'bg-green-100 text-green-800';
      case 'general':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.customer_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const openTickets = tickets.filter(t => t.status === 'open');
  const inProgressTickets = tickets.filter(t => t.status === 'in_progress');
  const resolvedTickets = tickets.filter(t => t.status === 'resolved');
  const urgentTickets = tickets.filter(t => t.priority === 'urgent');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading support tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Support</h1>
          <p className="text-gray-600">Manage customer support tickets</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Ticket
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open Tickets</p>
                <p className="text-2xl font-bold text-red-600">{openTickets.length}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{inProgressTickets.length}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{resolvedTickets.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Urgent</p>
                <p className="text-2xl font-bold text-orange-600">{urgentTickets.length}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-600" />
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
                  placeholder="Search tickets..."
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
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle>Support Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTickets.map((ticket) => (
              <div key={ticket.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{ticket.ticket_number}</h3>
                      <p className="text-sm text-gray-600">{ticket.subject}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          {ticket.customer_name}
                        </span>
                        <span className="flex items-center">
                          <Mail className="w-4 h-4 mr-1" />
                          {ticket.customer_email}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {ticket.created_date}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {ticket.response_time && (
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {ticket.response_time}
                        </p>
                        <p className="text-xs text-gray-600">Response</p>
                      </div>
                    )}
                    <Badge className={getPriorityColor(ticket.priority)}>
                      {ticket.priority.toUpperCase()}
                    </Badge>
                    <Badge className={getStatusColor(ticket.status)}>
                      {ticket.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <Badge className={getCategoryColor(ticket.category)}>
                      {ticket.category.toUpperCase()}
                    </Badge>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Reply className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Description:</span> {ticket.description}
                  </p>
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <Phone className="w-4 h-4 mr-1" />
                      {ticket.customer_phone}
                    </span>
                    <span className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      Assigned to: {ticket.assigned_to}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Updated: {ticket.updated_date}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
