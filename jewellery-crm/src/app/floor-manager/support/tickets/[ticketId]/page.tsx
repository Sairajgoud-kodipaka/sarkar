'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Send, User, Calendar, Tag, AlertCircle, CheckCircle, Clock, MessageSquare } from 'lucide-react';
import { apiService } from '@/lib/api-service';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  customer: {
    name: string;
    email: string;
    avatar: string;
  };
  assignedTo: string;
  createdAt: string;
  lastUpdated: string;
}

interface Message {
  id: string;
  content?: string;
  message?: string;
  sender_id: string;
  is_internal: boolean;
  message_type: string;
  created_at: string;
  sender_name?: string;
  sender_role?: string;
}

export default function FloorManagerTicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const ticketId = params.ticketId as string;
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);



  const fetchTicketDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getSupportTicket(ticketId);
      
      if (response.success && response.data) {
        const ticketData = response.data;
        setTicket({
          id: ticketData.id.toString(),
          title: ticketData.title,
          description: ticketData.description || ticketData.summary || '',
          status: ticketData.status,
          priority: ticketData.priority,
          category: ticketData.category || 'general',
          customer: {
            name: ticketData.customer?.name || ticketData.customer_name || 'Unknown Customer',
            email: ticketData.customer?.email || ticketData.customer_email || 'N/A',
            avatar: ''
          },
          assignedTo: ticketData.assigned_to_member ? 
            `${ticketData.assigned_to_member.first_name} ${ticketData.assigned_to_member.last_name}` : 
            'Unassigned',
          createdAt: ticketData.created_at,
          lastUpdated: ticketData.updated_at,
        });
        
        // Fetch messages separately to get sender information
        const messagesResponse = await apiService.getTicketMessages(ticketId);
        if (messagesResponse.success && messagesResponse.data) {
          setMessages(messagesResponse.data);
        }
      } else {
        setError('Ticket not found');
      }
    } catch (error) {
      console.error('Failed to fetch ticket details:', error);
      setError('Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    if (ticketId) {
      fetchTicketDetails();
    }
  }, [ticketId, fetchTicketDetails]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      setSendingMessage(true);
      console.log("Attempting to send message with user ID:", user?.id);
      const response = await apiService.createTicketMessage(ticketId, {
        content: newMessage,
        sender_id: user?.id,
        is_internal: false,
        message_type: 'text'
      });
      
      if (response.success) {
        setNewMessage('');
        await fetchTicketDetails(); // Refresh to get new message
        toast.success('Message sent successfully!');
      } else {
        setError(`Failed to send message: ${response.message}`);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setError(`Failed to send message: ${(error as Error).message}`);
    } finally {
      setSendingMessage(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'open': { text: 'Open', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      'in_progress': { text: 'In Progress', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      'resolved': { text: 'Resolved', color: 'bg-green-100 text-green-800 border-green-200' },
      'closed': { text: 'Closed', color: 'bg-gray-100 text-gray-800 border-gray-200' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open;
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      'low': { variant: 'secondary', className: 'bg-gray-100 text-gray-800' },
      'medium': { variant: 'default', className: 'bg-blue-100 text-blue-800' },
      'high': { variant: 'default', className: 'bg-orange-100 text-orange-800' },
      'urgent': { variant: 'destructive', className: 'bg-red-100 text-red-800' },
    };
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    return <Badge variant={config.variant as any} className={config.className}>{priority}</Badge>;
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
        hour: '2-digit',
        minute: '2-digit'
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
          <span>Loading ticket details...</span>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error Loading Ticket</h2>
        <p className="text-gray-600 mb-4">{error || 'Ticket not found'}</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Tickets
        </Button>
        <div className="flex items-center gap-2">
          {getStatusBadge(ticket.status)}
          {getPriorityBadge(ticket.priority)}
        </div>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">{ticket.title}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Conversation */}
          <Card>
            <CardHeader>
              <CardTitle>Conversation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No messages yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {message.sender_name ? message.sender_name[0] : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {message.sender_name || 'Unknown User'}
                          </span>
                          {message.sender_role && message.sender_role !== 'Unknown' && (
                            <Badge variant="outline" className="text-xs">
                              {message.sender_role}
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {formatDate(message.created_at)}
                          </span>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm">{message.message || message.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* New Message Input */}
              <div className="flex gap-2 pt-4 border-t">
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1"
                  rows={3}
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={!newMessage.trim() || sendingMessage}
                  className="self-end"
                >
                  {sendingMessage ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                {ticket.description || 'No description provided'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Information */}
          <Card>
            <CardHeader>
              <CardTitle>Ticket Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Category</span>
                <span className="text-sm text-gray-900 capitalize">{ticket.category ? ticket.category.replace('_', ' ') : 'Uncategorized'}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Created</span>
                <span className="text-sm text-gray-900">{formatDate(ticket.createdAt)}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Last Updated</span>
                <span className="text-sm text-gray-900">{formatDate(ticket.lastUpdated)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={ticket.customer.avatar} />
                  <AvatarFallback>
                    {ticket.customer.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{ticket.customer.name}</p>
                  <p className="text-sm text-gray-600">{ticket.customer.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assigned To */}
          <Card>
            <CardHeader>
              <CardTitle>Assigned To</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{ticket.assignedTo}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
