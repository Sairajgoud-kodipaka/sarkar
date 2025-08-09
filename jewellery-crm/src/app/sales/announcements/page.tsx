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
import { 
  Megaphone, 
  Pin, 
  MessageSquare, 
  Plus, 
  Send, 
  Reply, 
  Bell,
  Calendar,
  User,
  Filter,
  Search,
  AlertCircle,
  Info,
  CheckCircle,
  Settings
} from 'lucide-react';
import { apiService } from '@/lib/api-service';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import AddAnnouncementModal from '@/components/announcements/AddAnnouncementModal';
import AddMessageModal from '@/components/announcements/AddMessageModal';
import ReplyMessageModal from '@/components/announcements/ReplyMessageModal';

interface Announcement {
  id: number;
  title: string;
  content: string;
  type: 'general' | 'urgent' | 'maintenance' | 'feature' | 'policy';
  target_audience: string;
  is_pinned: boolean;
  is_active: boolean;
  created_by: string;
  created_by_member?: {
    first_name: string;
    last_name: string;
    role: string;
  };
  expires_at?: string;
  created_at: string;
  updated_at: string;
  replies?: AnnouncementReply[];
}

interface AnnouncementReply {
    id: number;
  announcement_id: number;
  reply_content: string;
  created_by: string;
  created_by_member?: {
    first_name: string;
    last_name: string;
    role: string;
  };
  is_public: boolean;
  created_at: string;
}

interface TeamMessage {
  id: number;
  subject: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  is_read: boolean;
  message_type: string;
  priority: string;
  sender?: {
    first_name: string;
    last_name: string;
    role: string;
    email: string;
  };
  recipient?: {
    first_name: string;
    last_name: string;
    role: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [teamMessages, setTeamMessages] = useState<TeamMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<TeamMessage | null>(null);
  const [activeTab, setActiveTab] = useState('announcements');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Modal states
  const [showAddAnnouncement, setShowAddAnnouncement] = useState(false);
  const [showAddMessage, setShowAddMessage] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyToAnnouncement, setReplyToAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch announcements
      const announcementsResponse = await apiService.getAnnouncements({
        target_audience: user?.user_metadata?.role,
        is_active: true
      });
      
      if (announcementsResponse.success) {
        // Fetch replies for each announcement
        const announcementsWithReplies = await Promise.all(
          announcementsResponse.data.map(async (announcement: Announcement) => {
            try {
              const repliesResponse = await apiService.getAnnouncementReplies(announcement.id);
              return {
                ...announcement,
                replies: repliesResponse.success ? repliesResponse.data : []
              };
            } catch (error) {
              console.error('Error fetching replies for announcement:', announcement.id, error);
              return { ...announcement, replies: [] };
            }
          })
        );
        setAnnouncements(announcementsWithReplies);
      }

      // Fetch team messages for current user
      if (user?.id) {
        const messagesResponse = await apiService.getTeamMessages({
          recipient_id: user.id,
          limit: 50
        });
        
        if (messagesResponse.success) {
          setTeamMessages(messagesResponse.data);
        }

        // Get unread message count
        const unreadResponse = await apiService.getUnreadMessageCount(user.id);
        if (unreadResponse.success) {
          setUnreadCount(unreadResponse.data);
        }
      }
    } catch (error) {
      console.error('Error fetching communication data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = async (announcementData: any) => {
    try {
      const response = await apiService.createAnnouncement({
        ...announcementData,
        created_by: user?.id
      });
      
      if (response.success) {
        setShowAddAnnouncement(false);
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
    }
  };

  const handleSendMessage = async (messageData: any) => {
    try {
      const response = await apiService.sendTeamMessage({
        ...messageData,
        sender_id: user?.id
      });
      
      if (response.success) {
        setShowAddMessage(false);
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleReplyToAnnouncement = async (replyData: any) => {
    if (!replyToAnnouncement) return;
    
    try {
      const response = await apiService.replyToAnnouncement(replyToAnnouncement.id, {
        reply_content: replyData.content,
        created_by: user?.id,
        is_public: replyData.is_public
      });
      
      if (response.success) {
        setShowReplyModal(false);
        setReplyToAnnouncement(null);
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error replying to announcement:', error);
    }
  };

  const markMessageAsRead = async (messageId: number) => {
    try {
      await apiService.markMessageAsRead(messageId);
      // Update local state
      setTeamMessages(messages => 
        messages.map(msg => 
          msg.id === messageId ? { ...msg, is_read: true } : msg
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const getAnnouncementIcon = (type: string) => {
    switch (type) {
      case 'urgent': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'maintenance': return <Settings className="w-5 h-5 text-yellow-500" />;
      case 'feature': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'policy': return <Info className="w-5 h-5 text-blue-500" />;
      default: return <Megaphone className="w-5 h-5 text-gray-500" />;
    }
  };

  const getAnnouncementBadge = (type: string) => {
    const config = {
      urgent: { color: 'bg-red-100 text-red-800', text: 'Urgent' },
      maintenance: { color: 'bg-yellow-100 text-yellow-800', text: 'Maintenance' },
      feature: { color: 'bg-green-100 text-green-800', text: 'New Feature' },
      policy: { color: 'bg-blue-100 text-blue-800', text: 'Policy' },
      general: { color: 'bg-gray-100 text-gray-800', text: 'General' }
    };
    
    const { color, text } = config[type as keyof typeof config] || config.general;
    return <Badge className={color}>{text}</Badge>;
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         announcement.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || announcement.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const filteredMessages = teamMessages.filter(message => {
    return message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
           message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
           message.sender?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           message.sender?.last_name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading communications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Communication</h1>
          <p className="text-gray-600 mt-1">Stay updated with announcements and team messages</p>
      </div>

        <div className="flex gap-3">
        <Button
            onClick={() => setShowAddMessage(true)}
            variant="outline"
          className="flex items-center gap-2"
        >
            <Send className="w-4 h-4" />
            Send Message
        </Button>
          
          {(user?.user_metadata?.role === 'business_admin' || user?.user_metadata?.role === 'floor_manager') && (
        <Button
              onClick={() => setShowAddAnnouncement(true)}
          className="flex items-center gap-2"
        >
              <Plus className="w-4 h-4" />
              New Announcement
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search announcements and messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
      </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="feature">New Feature</SelectItem>
            <SelectItem value="policy">Policy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="announcements" className="flex items-center gap-2">
            <Megaphone className="w-4 h-4" />
            Announcements ({filteredAnnouncements.length})
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Messages ({filteredMessages.length})
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white text-xs px-1 py-0 min-w-[16px] h-4">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Announcements Tab */}
        <TabsContent value="announcements" className="space-y-4">
          {filteredAnnouncements.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No announcements found</p>
              </CardContent>
            </Card>
          ) : (
            filteredAnnouncements.map((announcement) => (
              <Card key={announcement.id} className={`${announcement.is_pinned ? 'border-blue-200 bg-blue-50' : ''}`}>
                <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {announcement.is_pinned && <Pin className="w-4 h-4 text-blue-500" />}
                      {getAnnouncementIcon(announcement.type)}
                      <div>
                        <CardTitle className="text-lg">{announcement.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          {getAnnouncementBadge(announcement.type)}
                          <span className="text-sm text-gray-500">
                            by {announcement.created_by_member ? 
                              `${announcement.created_by_member.first_name} ${announcement.created_by_member.last_name}` : 
                              'Unknown'} • {format(new Date(announcement.created_at), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-gray-700 mb-4">{announcement.content}</p>
                  
                  {announcement.expires_at && (
                    <div className="flex items-center gap-2 text-sm text-orange-600 mb-4">
                      <Calendar className="w-4 h-4" />
                      Expires: {format(new Date(announcement.expires_at), 'MMM dd, yyyy')}
                </div>
                  )}

                  {/* Replies Section */}
                  {announcement.replies && announcement.replies.length > 0 && (
                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-semibold text-sm text-gray-700 mb-3">
                        Replies ({announcement.replies.length})
                      </h4>
                      <div className="space-y-3">
                        {announcement.replies.map((reply) => (
                          <div key={reply.id} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <User className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-medium">
                                {reply.created_by_member ? 
                                  `${reply.created_by_member.first_name} ${reply.created_by_member.last_name}` : 
                                  'Unknown'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {format(new Date(reply.created_at), 'MMM dd, HH:mm')}
                  </span>
                </div>
                            <p className="text-sm text-gray-700">{reply.reply_content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end mt-4">
                       <Button
                         variant="outline"
                         size="sm"
                      onClick={() => {
                        setReplyToAnnouncement(announcement);
                        setShowReplyModal(true);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Reply className="w-4 h-4" />
                      Reply
                       </Button>
                </div>
              </CardContent>
            </Card>
            ))
          )}
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-4">
          {filteredMessages.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No messages found</p>
              </CardContent>
            </Card>
          ) : (
            filteredMessages.map((message) => (
            <Card 
              key={message.id}
                className={`cursor-pointer transition-colors ${!message.is_read ? 'border-blue-200 bg-blue-50' : ''}`}
                onClick={() => {
                  setSelectedMessage(message);
                  if (!message.is_read) {
                    markMessageAsRead(message.id);
                  }
                }}
              >
                <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {!message.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                      <div>
                        <CardTitle className="text-lg">{message.subject}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`${message.priority === 'urgent' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                            {message.priority}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            from {message.sender ? 
                              `${message.sender.first_name} ${message.sender.last_name}` : 
                              'Unknown'} • {format(new Date(message.created_at), 'MMM dd, yyyy HH:mm')}
                        </span>
                      </div>
                    </div>
                  </div>
                   </div>
                </CardHeader>
                
          <CardContent>
                  <p className="text-gray-700 line-clamp-3">{message.content}</p>
          </CardContent>
        </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AddAnnouncementModal
        isOpen={showAddAnnouncement}
        onClose={() => setShowAddAnnouncement(false)}
        onSuccess={handleCreateAnnouncement}
      />

      <AddMessageModal
        isOpen={showAddMessage}
        onClose={() => setShowAddMessage(false)}
        onSuccess={handleSendMessage}
      />

      <ReplyMessageModal
        isOpen={showReplyModal}
        onClose={() => {
          setShowReplyModal(false);
          setReplyToAnnouncement(null);
        }}
        announcement={replyToAnnouncement}
        onSuccess={handleReplyToAnnouncement}
      />

      {/* Message Detail Modal */}
      {selectedMessage && (
        <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedMessage.subject}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <User className="w-4 h-4" />
                From: {selectedMessage.sender ? 
                  `${selectedMessage.sender.first_name} ${selectedMessage.sender.last_name} (${selectedMessage.sender.role})` : 
                  'Unknown'}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                Sent: {format(new Date(selectedMessage.created_at), 'MMMM dd, yyyy HH:mm')}
              </div>
              
              <div className="border-t pt-4">
                <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.content}</p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedMessage(null)}>
                Close
              </Button>
              <Button onClick={() => {
                // TODO: Implement reply to message functionality
                setSelectedMessage(null);
              }}>
                Reply
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 