'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin,
  Calendar,
  Edit,
  Save,
  X,
  Award,
  TrendingUp,
  Target,
  Users,
  MessageSquare,
  PhoneCall
} from 'lucide-react';
import { apiService } from '@/lib/api-service';

interface SalesProfile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  floor?: number;
  store?: string;
  join_date: string;
  total_sales: number;
  total_orders: number;
  conversion_rate: number;
  target_achievement: number;
  avatar_url?: string;
}

export default function SalesProfilePage() {
  const [profile, setProfile] = useState<SalesProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  });
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [showTeamSection, setShowTeamSection] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchTeamMembers();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      // Load real profile from team_members table
      const teamMembers = await apiService.getTeamMembers();
      
      if (teamMembers && teamMembers.length > 0) {
        // Find current user's profile (you might want to match by email or ID)
        // For now, using the first sales associate as example
        const userProfile = teamMembers.find(member => 
          member.role === 'sales_associate'
        ) || teamMembers[0];
        
        // Calculate real performance metrics
        const salesResponse = await apiService.getSales();
        const ordersResponse = await apiService.getOrders();
        
        if (salesResponse.success && ordersResponse.success) {
          const userSales = salesResponse.data.filter((sale: any) => 
            sale.sales_person_id === userProfile.id
          );
          const userOrders = ordersResponse.data.filter((order: any) => 
            order.sales_person_id === userProfile.id
          );
          
          const totalSales = userSales.reduce((sum: number, sale: any) => 
            sum + (sale.total_amount || 0), 0
          );
          const totalOrders = userOrders.length;
          const conversionRate = totalOrders > 0 ? 
            (userSales.length / totalOrders) * 100 : 0;
          
          const transformedProfile: SalesProfile = {
            id: Number(userProfile.id),
            first_name: userProfile.name.split(' ')[0] || '',
            last_name: userProfile.name.split(' ').slice(1).join(' ') || '',
            email: userProfile.email,
            phone: userProfile.phone || '',
            role: userProfile.role,
            floor: Number(userProfile.floor) || 1,
            store: 'Main Store', // Default value
            join_date: userProfile.joinDate?.split('T')[0] || '',
            total_sales: totalSales,
            total_orders: totalOrders,
            conversion_rate: conversionRate,
            target_achievement: 75, // Default target, could be configurable
            avatar_url: userProfile.avatar || ''
          };
          
          setProfile(transformedProfile);
          setEditForm({
            first_name: transformedProfile.first_name,
            last_name: transformedProfile.last_name,
            email: transformedProfile.email,
            phone: transformedProfile.phone,
          });
        }
      } else {
        console.log('No team members found');
        setProfile(null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const members = await apiService.getTeamMembers();
      setTeamMembers(members);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
    });
  };

  const handleSave = async () => {
    try {
      // Here you would make an API call to update the profile
      console.log('Saving profile:', editForm);
      
      // Mock successful update
      if (profile) {
        setProfile({
          ...profile,
          ...editForm
        });
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'sales_team': return 'Sales Team';
      case 'inhouse_sales': return 'In-House Sales';
      case 'sales_associate': return 'Sales Associate';
      default: return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading profile...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Profile not found</h3>
        <p className="text-gray-600">Unable to load your profile information</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600">Manage your personal information and view performance</p>
        </div>
        <Button 
          variant={isEditing ? "outline" : "default"}
          onClick={isEditing ? handleCancel : handleEdit}
        >
          {isEditing ? (
            <>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </>
          ) : (
            <>
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <Input
                        value={editForm.first_name}
                        onChange={(e) => setEditForm({...editForm, first_name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <Input
                        value={editForm.last_name}
                        onChange={(e) => setEditForm({...editForm, last_name: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <Input
                      value={editForm.phone}
                      onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSave}>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {profile.first_name} {profile.last_name}
                      </h3>
                      <p className="text-gray-600">{getRoleDisplayName(profile.role)}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{profile.email}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{profile.phone}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{profile.store}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">Joined {formatDate(profile.join_date)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>
                Your sales performance and achievements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(profile.total_sales)}</p>
                  <p className="text-sm text-gray-600">Total Sales</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">{profile.total_orders}</p>
                  <p className="text-sm text-gray-600">Total Orders</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <Award className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-yellow-600">{profile.conversion_rate}%</p>
                  <p className="text-sm text-gray-600">Conversion Rate</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-600">{profile.target_achievement}%</p>
                  <p className="text-sm text-gray-600">Target Achievement</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Role & Status */}
          <Card>
            <CardHeader>
              <CardTitle>Role & Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Role</p>
                <Badge className="mt-1">{getRoleDisplayName(profile.role)}</Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">Floor</p>
                <p className="font-medium">Floor {profile.floor}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Store</p>
                <p className="font-medium">{profile.store}</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="w-4 h-4 mr-2" />
                View Schedule
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="w-4 h-4 mr-2" />
                Sales Report
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Target className="w-4 h-4 mr-2" />
                Set Targets
              </Button>
            </CardContent>
          </Card>

          {/* Team Communication */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Team Communication</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowTeamSection(!showTeamSection)}
                >
                  {showTeamSection ? 'Hide' : 'Show'}
                </Button>
              </CardTitle>
            </CardHeader>
            {showTeamSection && (
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {teamMembers.slice(0, 5).map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{member.name}</p>
                          <p className="text-xs text-gray-500">{member.role}</p>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button size="sm" variant="ghost" className="p-1">
                          <MessageSquare className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="p-1">
                          <PhoneCall className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full">
                  <Users className="w-4 h-4 mr-2" />
                  View All Team Members
                </Button>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
