'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  TrendingUp, 
  Plus, 
  Users, 
  Target,
  DollarSign,
  Calendar,
  Send,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Filter,
  Search,
  User
} from 'lucide-react';
import { apiService } from '@/lib/api-service';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  floor: number;
  store_id: number;
}

interface Lead {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  product_id?: number;
  product_name?: string;
  product_price?: number;
  product_image_url?: string;
  amount: number;
  assigned_to?: string;
  assigned_to_name?: string;
  stage: 'potential' | 'demo' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  floor: number;
  store_id?: number;
  created_at: string;
  last_updated: string;
  notes?: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  image_url?: string;
  description?: string;
  category?: string;
}

interface PipelineStage {
  id: string;
  name: string;
  leads: Lead[];
  color: string;
}

interface SalesPerson {
  id: string;
  name: string;
  email: string;
  active_leads: number;
  role: string;
  floor: number;
}

interface SalesReport {
  id: string;
  floor: number;
  week_start: string;
  week_end: string;
  total_leads: number;
  converted_leads: number;
  total_revenue: number;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
}

export default function FloorManagerSalesPage() {
  // State for real data
  const [leads, setLeads] = useState<Lead[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesPeople, setSalesPeople] = useState<SalesPerson[]>([]);
  const [salesReports, setSalesReports] = useState<SalesReport[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [isCreateLeadOpen, setIsCreateLeadOpen] = useState(false);
  const [isEditLeadOpen, setIsEditLeadOpen] = useState(false);
  const [isViewLeadOpen, setIsViewLeadOpen] = useState(false);
  const [isAssignLeadOpen, setIsAssignLeadOpen] = useState(false);
  const [isSubmitReportOpen, setIsSubmitReportOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedSalesPerson, setSelectedSalesPerson] = useState<string>('');
  
  // Form State
  const [newLead, setNewLead] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    product_id: 0,
    amount: 0,
    notes: ''
  });

  const [editLead, setEditLead] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    product_id: 0,
    amount: 0,
    notes: ''
  });

  const [newReport, setNewReport] = useState({
    period: 'week', // 'today', 'week', 'month'
    notes: ''
  });

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [salespersonFilter, setSalespersonFilter] = useState<string>('all');

  // Get current user's floor
  const [userFloor, setUserFloor] = useState<number>(1);

  useEffect(() => {
    fetchSalesData();
    setupRealTimeUpdates();
    getUserFloor();
  }, []);

  const getUserFloor = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Get user's floor from team_members table
        const { data: teamMember } = await supabase
          .from('team_members')
          .select('floor')
          .eq('id', user.id)
          .single();
        
        if (teamMember?.floor) {
          setUserFloor(teamMember.floor);
        }
      }
    } catch (error) {
      console.error('Error getting user floor:', error);
    }
  };

  const setupRealTimeUpdates = () => {
    const subscription = supabase
      .channel('sales_data_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        fetchSalesData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales_reports' }, () => {
        fetchSalesData();
      })
      .subscribe();

    return () => subscription.unsubscribe();
  };

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      
      // Fetch real data from API
      const [leadsResponse, customersResponse, salesPeopleResponse, reportsResponse, productsResponse] = await Promise.all([
        apiService.getLeads({ floor: userFloor }),
        apiService.getCustomers({ floor: userFloor }),
        apiService.getTeamMembers(),
        apiService.getSalesReports({ floor: userFloor }),
        apiService.getProducts()
      ]);

      if (leadsResponse.success) {
        setLeads(leadsResponse.data || []);
      } else {
        console.error('Error fetching leads:', leadsResponse.message);
        setLeads([]);
      }

      if (customersResponse.success) {
        setCustomers(customersResponse.data || []);
      } else {
        console.error('Error fetching customers:', customersResponse.message);
        setCustomers([]);
      }

      if (productsResponse.success) {
        setProducts(productsResponse.data || []);
      } else {
        console.error('Error fetching products:', productsResponse.message);
        setProducts([]);
      }

      // Map product information to leads AFTER both leads and products are fetched
      if (leadsResponse.success && productsResponse.success) {
        const leadsData = leadsResponse.data || [];
        const productsData = productsResponse.data || [];
        
        const leadsWithProducts = leadsData.map(lead => {
          const product = productsData.find(p => p.id === lead.product_id) as Product | undefined;
          return {
            ...lead,
            product_name: product?.name || 'Product not selected',
            product_price: product?.price || 0,
            product_image_url: product?.image_url || null
          };
        });
        setLeads(leadsWithProducts);
      }

      // getTeamMembers returns TeamMember[] directly, not ApiResponse
      if (salesPeopleResponse && Array.isArray(salesPeopleResponse)) {
        // Filter to show only sales team members and transform to SalesPerson format
        const salesTeam = salesPeopleResponse
          .filter((member: any) => ['sales_associate', 'inhouse_sales'].includes(member.role))
          .map((member: any) => ({
            id: member.id,
            name: member.name,
            email: member.email,
            active_leads: member.performance?.customers || 0,
            role: member.role,
            floor: member.floor ? (typeof member.floor === 'number' ? member.floor : parseInt(member.floor.toString().replace(/[^\d]/g, ''))) : 1
          }));
        setSalesPeople(salesTeam);
      } else {
        console.error('Error fetching sales people: Invalid response format');
        setSalesPeople([]);
      }

      if (reportsResponse.success) {
        setSalesReports(reportsResponse.data || []);
      } else {
        console.error('Error fetching sales reports:', reportsResponse.message);
        setSalesReports([]);
      }

    } catch (error) {
      console.error('Error fetching sales data:', error);
      toast.error('Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLead = async () => {
    try {
      const leadData = {
        customer_name: newLead.customer_name,
        customer_phone: newLead.customer_phone,
        customer_email: newLead.customer_email,
        product_id: newLead.product_id,
        amount: newLead.amount || 0,
        floor: userFloor,
        notes: newLead.notes
      };

      const response = await apiService.createLead(leadData);
      if (response.success) {
        toast.success('Lead created successfully!');
        setIsCreateLeadOpen(false);
        setNewLead({
          customer_name: '',
          customer_phone: '',
          customer_email: '',
          product_id: 0,
          amount: 0,
          notes: ''
        });
        fetchSalesData(); // Refresh data
      } else {
        toast.error(response.message || 'Failed to create lead');
      }
    } catch (error) {
      console.error('Error creating lead:', error);
      toast.error('Failed to create lead');
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete lead from database
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (error) {
        throw new Error(error.message);
      }

      toast.success('Lead deleted successfully!');
      fetchSalesData(); // Refresh data
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.error('Failed to delete lead');
    }
  };

  const handleEditLead = async () => {
    if (!selectedLead) return;

    try {
      // Update lead in database
      const { error } = await supabase
        .from('leads')
        .update({
          customer_name: editLead.customer_name,
          customer_phone: editLead.customer_phone,
          customer_email: editLead.customer_email,
          product_id: editLead.product_id,
          amount: editLead.amount || 0,
          notes: editLead.notes,
          last_updated: new Date().toISOString()
        })
        .eq('id', selectedLead.id);

      if (error) {
        throw new Error(error.message);
      }

      toast.success('Lead updated successfully!');
      setIsEditLeadOpen(false);
      setSelectedLead(null);
      fetchSalesData(); // Refresh data
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Failed to update lead');
    }
  };

  const handleAssignLead = async () => {
    if (!selectedLead || !selectedSalesPerson) return;

    try {
      const response = await apiService.assignLeadToSalesperson(selectedLead.id, selectedSalesPerson);
      if (response.success) {
        // Get the salesperson name for immediate display
        const salesperson = salesPeople.find(sp => sp.id === selectedSalesPerson);
        const salespersonName = salesperson?.name || 'Unknown';
        
        // Immediately update the local state for instant UI feedback
        setLeads(prevLeads => 
          prevLeads.map(lead => 
            lead.id === selectedLead.id 
              ? { 
                  ...lead, 
                  assigned_to: selectedSalesPerson,
                  assigned_to_name: salespersonName 
                }
              : lead
          )
        );
        
        toast.success(`Lead assigned successfully to ${salespersonName}!`);
        setIsAssignLeadOpen(false);
        setSelectedLead(null);
        setSelectedSalesPerson('');
        
        // Refresh data to ensure consistency
        fetchSalesData();
      } else {
        toast.error(response.message || 'Failed to assign lead');
      }
    } catch (error) {
      console.error('Error assigning lead:', error);
      toast.error('Failed to assign lead');
    }
  };

  const handleStageChange = async (leadId: string, newStage: Lead['stage']) => {
    try {
      const response = await apiService.updateLeadStage(leadId, newStage);
      if (response.success) {
        toast.success('Lead stage updated successfully!');
        fetchSalesData(); // Refresh data
      } else {
        toast.error(response.message || 'Failed to update lead stage');
      }
    } catch (error) {
      console.error('Error updating lead stage:', error);
      toast.error('Failed to update lead stage');
    }
  };

  const handleSubmitWeeklyReport = async () => {
    try {
      // Calculate date range based on selected period
      const now = new Date();
      let startDate, endDate;
      
      switch (newReport.period) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
          break;
        case 'week':
          const dayOfWeek = now.getDay();
          const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
          startDate = new Date(now.getFullYear(), now.getMonth(), diff);
          endDate = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      }

      console.log('Date range:', { startDate, endDate, period: newReport.period });

      // Get leads data for the selected period
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('floor', userFloor)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Enrich leads data with product and salesperson information
      const enrichedLeadsData = leadsData?.map(lead => {
        const product = products.find(p => p.id === lead.product_id);
        const salesperson = salesPeople.find(sp => sp.id === lead.assigned_to);
        
        return {
          ...lead,
          product_name: product?.name || 'Product not selected',
          product_price: product?.price || 0,
          salesperson_name: salesperson?.name || 'Unassigned'
        };
      }) || [];

      console.log('Leads data:', { 
        totalLeads: leadsData?.length || 0, 
        enrichedLeads: enrichedLeadsData.length,
        productsCount: products.length,
        salesPeopleCount: salesPeople.length
      });

      // Get current user for floor_manager_id
      const { data: { user } } = await supabase.auth.getUser();
      console.log('🔍 Current user submitting report:', user?.id, user?.email);
      
      // Check if user exists in team_members table
      if (user?.id) {
        const { data: teamMember } = await supabase
          .from('team_members')
          .select('id, first_name, last_name, email, role')
          .eq('id', user.id)
          .single();
        
        console.log('🔍 Team member lookup result:', teamMember);
        
        if (!teamMember) {
          console.warn('⚠️ User not found in team_members table. This might cause issues with name display.');
        }
      }
      
      // Create sales report
      const { data, error } = await supabase
        .from('sales_reports')
        .insert({
          floor: userFloor,
          period: newReport.period,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          notes: newReport.notes,
          store_id: 1,
          floor_manager_id: user?.id,
          report_data: enrichedLeadsData // Store the enriched data for CSV generation
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      toast.success('Sales report submitted successfully!');
      setIsSubmitReportOpen(false);
      setNewReport({ period: 'week', notes: '' });
    } catch (error) {
      console.error('Error submitting sales report:', error);
      toast.error('Failed to submit sales report');
    }
  };

  const handleProductSelection = (productId: string) => {
    const product = products.find(p => p.id.toString() === productId);
    if (product) {
      setNewLead(prev => ({
        ...prev,
        product_id: parseInt(productId, 10),
        amount: product.price || 0
      }));
    }
  };

  const handleEditProductSelection = (productId: string) => {
    const product = products.find(p => p.id.toString() === productId);
    if (product) {
      setEditLead(prev => ({
        ...prev,
        product_id: parseInt(productId, 10),
        amount: product.price || 0
      }));
    }
  };

  const handleMoveLeadStage = async (leadId: string, newStage: string) => {
    try {
      const response = await apiService.updateLeadStage(leadId, newStage);
      if (response.success) {
        toast.success('Lead stage updated successfully!');
        fetchSalesData(); // Refresh data
      } else {
        toast.error(response.message || 'Failed to update lead stage');
      }
    } catch (error) {
      console.error('Error updating lead stage:', error);
      toast.error('Failed to update lead stage');
    }
  };

  // Calculate stats from real data
  const stats = {
    total_leads: leads.length,
    potential: leads.filter(lead => lead.stage === 'potential').length,
    demo: leads.filter(lead => lead.stage === 'demo').length,
    proposal: leads.filter(lead => lead.stage === 'proposal').length,
    negotiation: leads.filter(lead => lead.stage === 'negotiation').length,
    closed_won: leads.filter(lead => lead.stage === 'closed_won').length,
    closed_lost: leads.filter(lead => lead.stage === 'closed_lost').length
  };

  // Filter leads based on search and filters
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (lead.product_name && lead.product_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStage = stageFilter === 'all' || lead.stage === stageFilter;
    const matchesSalesperson = salespersonFilter === 'all' || lead.assigned_to === salespersonFilter;
    
    return matchesSearch && matchesStage && matchesSalesperson;
  });

  // Get pipeline stages with filtered leads
  const getPipelineStages = (): PipelineStage[] => {
    const stages: PipelineStage[] = [
      { id: 'potential', name: 'Potential', leads: [], color: 'bg-blue-50 border-blue-200' },
      { id: 'demo', name: 'Lead', leads: [], color: 'bg-yellow-50 border-yellow-200' },
      { id: 'proposal', name: 'Proposal', leads: [], color: 'bg-purple-50 border-purple-200' },
      { id: 'negotiation', name: 'Negotiation', leads: [], color: 'bg-orange-50 border-orange-200' },
      { id: 'closed_won', name: 'Closed Won', leads: [], color: 'bg-green-50 border-green-200' },
      { id: 'closed_lost', name: 'Closed Lost', leads: [], color: 'bg-red-50 border-red-200' }
    ];

    // Group filtered leads by stage
    filteredLeads.forEach(lead => {
      const stage = stages.find(s => s.id === lead.stage);
      if (stage) {
        stage.leads.push(lead);
      }
    });

    return stages;
  };

  const pipelineStages = getPipelineStages();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading sales data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Pipeline</h1>
          <p className="text-gray-600">Manage leads and sales pipeline for your floor</p>
        </div>
        <div className="flex gap-2">
                     <Button variant="outline" onClick={() => setIsSubmitReportOpen(true)}>
             <Send className="w-4 h-4 mr-2" />
             Submit Sales Report
           </Button>
          <Button onClick={() => setIsCreateLeadOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search leads by customer name or product..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  <SelectItem value="potential">Potential</SelectItem>
                  <SelectItem value="demo">Lead</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="negotiation">Negotiation</SelectItem>
                  <SelectItem value="closed_won">Closed Won</SelectItem>
                  <SelectItem value="closed_lost">Closed Lost</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={salespersonFilter} onValueChange={setSalespersonFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by salesperson" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Salespeople</SelectItem>
                  {salesPeople.map(sp => (
                    <SelectItem key={sp.id} value={sp.id}>
                      {sp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm font-medium text-gray-600">Total</p>
            <p className="text-2xl font-bold text-blue-600">{stats.total_leads}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm font-medium text-gray-600">Potential</p>
            <p className="text-2xl font-bold text-blue-600">{stats.potential}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm font-medium text-gray-600">Lead</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.demo}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm font-medium text-gray-600">Proposal</p>
            <p className="text-2xl font-bold text-purple-600">{stats.proposal}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm font-medium text-gray-600">Negotiation</p>
            <p className="text-2xl font-bold text-orange-600">{stats.negotiation}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm font-medium text-gray-600">Won</p>
            <p className="text-2xl font-bold text-green-600">{stats.closed_won}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm font-medium text-gray-600">Lost</p>
            <p className="text-2xl font-bold text-red-600">{stats.closed_lost}</p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Board - Moved Above Active Leads */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Pipeline Stages</CardTitle>
            <CardDescription>Visual pipeline view of all leads across stages</CardDescription>
          </div>
          <Button onClick={() => setIsCreateLeadOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Lead
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {pipelineStages.map((stage) => (
              <div key={stage.id} className="min-h-[400px]">
                <div className={`rounded-t-lg p-3 text-center ${stage.color} border-b-2`}>
                  <h3 className="font-semibold text-gray-800 text-lg">{stage.name}</h3>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <div className="bg-white/80 rounded-full px-2 py-1">
                      <span className="text-sm font-bold text-gray-800">{stage.leads.length}</span>
                    </div>
                    <span className="text-xs text-gray-600">leads</span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-b-lg p-3 min-h-[350px]">
                  <div className="space-y-3">
                    {stage.leads.map((lead) => (
                      <div key={lead.id} className="bg-white rounded-lg p-3 border shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm text-gray-900">
                            <span className="text-gray-500">cust_name:</span> {lead.customer_name}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            ₹{(lead.amount || 0).toLocaleString()}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-3">
                          {lead.product_id && products.find(p => p.id === lead.product_id)?.image_url && (
                            <img 
                              src={products.find(p => p.id === lead.product_id)?.image_url} 
                              alt="Product"
                              className="w-10 h-10 rounded object-cover border"
                            />
                          )}
                          <div className="flex-1">
                            <p className="text-xs text-gray-700 font-medium">{lead.product_name || 'Product not selected'}</p>
                            <p className="text-xs text-gray-500">{lead.customer_phone}</p>
                            <p className="text-xs text-gray-600">
                              <span className="text-gray-500">assigned:</span> {lead.assigned_to_name || 'Unassigned'}
                            </p>
                          </div>
                        </div>
                        
                        {lead.assigned_to_name && (
                          <div className="flex items-center gap-1 mb-2">
                            <User className="w-3 h-3 text-blue-600" />
                            <p className="text-xs text-blue-600 font-medium">
                              {lead.assigned_to_name}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex gap-1 mb-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 text-xs h-7"
                            onClick={() => {
                              setSelectedLead(lead);
                              setEditLead({
                                customer_name: lead.customer_name,
                                customer_phone: lead.customer_phone,
                                customer_email: lead.customer_email || '',
                                product_id: lead.product_id || 0,
                                amount: lead.amount || 0,
                                notes: lead.notes || ''
                              });
                              setIsEditLeadOpen(true);
                            }}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 text-xs h-7"
                            onClick={() => {
                              setSelectedLead(lead);
                              setIsAssignLeadOpen(true);
                            }}
                          >
                            <UserPlus className="w-3 h-3 mr-1" />
                            Assign
                          </Button>
                        </div>

                        {/* Stage Movement Controls */}
                        <div className="flex gap-1">
                          {lead.stage !== 'potential' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="flex-1 text-xs h-6 bg-blue-50 hover:bg-blue-100 text-blue-700"
                              onClick={() => handleMoveLeadStage(lead.id, 'potential')}
                            >
                              ← Potential
                            </Button>
                          )}
                          {lead.stage !== 'closed_won' && lead.stage !== 'closed_lost' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="flex-1 text-xs h-6 bg-green-50 hover:bg-green-100 text-green-700"
                              onClick={() => {
                                const nextStage = lead.stage === 'potential' ? 'demo' : 
                                               lead.stage === 'demo' ? 'proposal' : 
                                               lead.stage === 'proposal' ? 'negotiation' : 'closed_won';
                                handleMoveLeadStage(lead.id, nextStage);
                              }}
                            >
                              {lead.stage === 'potential' ? 'Lead →' :
                               lead.stage === 'demo' ? 'Proposal →' :
                               lead.stage === 'proposal' ? 'Negotiation →' : 'Close Won →'}
                            </Button>
                          )}
                          
                          {/* Close Lost Button - Available for all stages except already closed */}
                          {lead.stage !== 'closed_won' && lead.stage !== 'closed_lost' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="flex-1 text-xs h-6 bg-red-50 hover:bg-red-100 text-red-700"
                              onClick={() => handleMoveLeadStage(lead.id, 'closed_lost')}
                            >
                              Close Lost
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {stage.leads.length === 0 && (
                      <div className="text-center text-gray-400 text-sm py-8">
                        <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gray-100 flex items-center justify-center">
                          <Plus className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-gray-500">No leads</p>
                        <p className="text-xs text-gray-400 mt-1">Add leads to get started</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Leads Section */}
      <Card>
        <CardHeader>
          <CardTitle>Active Leads</CardTitle>
          <CardDescription>Detailed view of all leads for management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leads.map((lead) => (
              <div key={lead.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{lead.customer_name}</h3>
                  <Badge variant="secondary">{lead.stage}</Badge>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  {lead.product_id && products.find(p => p.id === lead.product_id)?.image_url && (
                    <img 
                      src={products.find(p => p.id === lead.product_id)?.image_url} 
                      alt="Product"
                      className="w-12 h-12 rounded object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 font-medium">{lead.product_name || 'Product not selected'}</p>
                    <p className="text-sm text-gray-600">₹{(lead.amount || 0).toLocaleString()}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  {lead.assigned_to_name ? `Assigned to: ${lead.assigned_to_name}` : 'Not assigned'}
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedLead(lead);
                      setIsAssignLeadOpen(true);
                    }}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    {lead.assigned_to ? 'Reassign' : 'Assign'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedLead(lead);
                      setEditLead({
                        customer_name: lead.customer_name,
                        customer_phone: lead.customer_phone,
                        customer_email: lead.customer_email || '',
                        product_id: lead.product_id || 0,
                        amount: lead.amount || 0,
                        notes: lead.notes || ''
                      });
                      setIsEditLeadOpen(true);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </div>
            ))}
            
            {leads.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                No leads found. Create your first lead to get started!
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sales Team Members */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Team</CardTitle>
          <CardDescription>View salespeople and their current lead assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {salesPeople.map((person) => (
              <div key={person.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{person.name}</h3>
                  <Badge variant="secondary">{person.active_leads} leads</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">{person.email}</p>
                <p className="text-xs text-gray-500 mb-2">Floor {person.floor}</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedLead(null);
                    setIsAssignLeadOpen(true);
                  }}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Assign New Lead
                </Button>
              </div>
            ))}
            
            {salesPeople.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                No sales team members found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Lead Dialog */}
      <Dialog open={isCreateLeadOpen} onOpenChange={setIsCreateLeadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Customer</label>
              <Select value={newLead.customer_name} onValueChange={(value) => {
                const customer = customers.find(c => c.name === value);
                setNewLead(prev => ({
                  ...prev,
                  customer_name: value,
                  customer_phone: customer?.phone || '',
                  customer_email: customer?.email || ''
                }));
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select existing customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.name}>
                      {customer.name} - {customer.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Select an existing customer or fill in details below for a new customer
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium">Customer Name</label>
              <Input
                value={newLead.customer_name}
                onChange={(e) => setNewLead(prev => ({ ...prev, customer_name: e.target.value }))}
                placeholder="Enter customer name"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Phone Number</label>
              <Input
                value={newLead.customer_phone}
                onChange={(e) => setNewLead(prev => ({ ...prev, customer_phone: e.target.value }))}
                placeholder="Enter phone number"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Email (Optional)</label>
              <Input
                value={newLead.customer_email}
                onChange={(e) => setNewLead(prev => ({ ...prev, customer_email: e.target.value }))}
                placeholder="Enter email address"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Product Interest</label>
              <Select value={newLead.product_id > 0 ? newLead.product_id.toString() : ''} onValueChange={(value) => handleProductSelection(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      <div className="flex items-center gap-3">
                        {product.image_url && (
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="w-8 h-8 rounded object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500">₹{product.price.toLocaleString()}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Amount</label>
              <Input
                type="number"
                value={newLead.amount}
                onChange={(e) => setNewLead(prev => ({ ...prev, amount: parseInt(e.target.value, 10) || 0 }))}
                placeholder="Enter amount"
              />
              <p className="text-xs text-gray-500 mt-1">
                Amount is automatically set based on the selected product price
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium">Notes (Optional)</label>
              <Textarea
                value={newLead.notes}
                onChange={(e) => setNewLead(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about the lead"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateLeadOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateLead} disabled={!newLead.customer_name || !newLead.customer_phone || !newLead.product_id || newLead.amount === 0}>
              Create Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Lead Dialog */}
      <Dialog open={isEditLeadOpen} onOpenChange={setIsEditLeadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Customer Name</label>
              <Input
                value={editLead.customer_name}
                onChange={(e) => setEditLead(prev => ({ ...prev, customer_name: e.target.value }))}
                placeholder="Enter customer name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Phone Number</label>
              <Input
                value={editLead.customer_phone}
                onChange={(e) => setEditLead(prev => ({ ...prev, customer_phone: e.target.value }))}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email (Optional)</label>
              <Input
                value={editLead.customer_email}
                onChange={(e) => setEditLead(prev => ({ ...prev, customer_email: e.target.value }))}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Product Interest</label>
              <Select value={editLead.product_id > 0 ? editLead.product_id.toString() : ''} onValueChange={(value) => handleEditProductSelection(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      <div className="flex items-center gap-3">
                        {product.image_url && (
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="w-8 h-8 rounded object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500">₹{product.price.toLocaleString()}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Amount</label>
              <Input
                type="number"
                value={editLead.amount}
                onChange={(e) => setEditLead(prev => ({ ...prev, amount: parseInt(e.target.value, 10) || 0 }))}
                placeholder="Enter amount"
              />
              <p className="text-xs text-gray-500 mt-1">
                Amount is automatically set based on the selected product price
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Notes (Optional)</label>
              <Input
                value={editLead.notes}
                onChange={(e) => setEditLead(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about the lead"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditLeadOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditLead}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Lead Dialog */}
      <Dialog open={isAssignLeadOpen} onOpenChange={setIsAssignLeadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Lead to Salesperson</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Lead Selection */}
            <div>
              <label className="text-sm font-medium">Select Lead</label>
              <Select value={selectedLead?.id || ''} onValueChange={(leadId) => {
                const lead = leads.find(l => l.id === leadId);
                setSelectedLead(lead || null);
                // Auto-select current salesperson if lead is already assigned
                if (lead?.assigned_to && !selectedSalesPerson) {
                  setSelectedSalesPerson(lead.assigned_to);
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a lead to assign" />
                </SelectTrigger>
                <SelectContent>
                  {leads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      <div className="flex items-center gap-3">
                        {lead.product_image_url && (
                          <img 
                            src={lead.product_image_url} 
                            alt="Product"
                            className="w-8 h-8 rounded object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{lead.customer_name}</div>
                          <div className="text-sm text-gray-500">
                            {lead.product_name || 'Product not selected'} - ₹{(lead.amount || 0).toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-400">
                            {lead.assigned_to_name ? `Currently: ${lead.assigned_to_name}` : 'Unassigned'}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Lead Details Display */}
            {selectedLead && (
              <div className="p-4 bg-gray-50 rounded-lg border">
                <h4 className="font-medium text-gray-900 mb-3">Lead Details</h4>
                <div className="flex items-start gap-3">
                  {selectedLead.product_image_url && (
                    <img 
                      src={selectedLead.product_image_url} 
                      alt="Product"
                      className="w-16 h-16 rounded object-cover border"
                    />
                  )}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{selectedLead.customer_name}</p>
                      <Badge variant="outline" className="text-xs">
                        ₹{(selectedLead.amount || 0).toLocaleString()}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700">
                      <strong>Product:</strong> {selectedLead.product_name || 'Product not selected'}
                    </p>
                    <p className="text-sm text-gray-600">{selectedLead.customer_phone}</p>
                    {selectedLead.assigned_to_name && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-600" />
                        <p className="text-sm text-blue-600">
                          <strong>Currently assigned to:</strong> {selectedLead.assigned_to_name}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Salesperson Selection */}
            <div>
              <label className="text-sm font-medium">Select New Salesperson</label>
              <Select 
                value={selectedSalesPerson} 
                onValueChange={setSelectedSalesPerson}
                onOpenChange={() => {
                  // Auto-select currently assigned salesperson if exists
                  if (selectedLead?.assigned_to && !selectedSalesPerson) {
                    setSelectedSalesPerson(selectedLead.assigned_to);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a salesperson" />
                </SelectTrigger>
                <SelectContent>
                  {salesPeople.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{person.name}</span>
                        <span className="text-gray-500 text-xs">({person.active_leads} leads)</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                {selectedLead?.assigned_to_name ? 
                  `Currently assigned to ${selectedLead.assigned_to_name}. Select a new salesperson to reassign.` : 
                  'Select a salesperson to assign this lead to.'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignLeadOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignLead} disabled={!selectedSalesPerson || !selectedLead}>
              {selectedLead?.assigned_to ? 'Reassign Lead' : 'Assign Lead'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

             {/* Submit Sales Report Dialog */}
       <Dialog open={isSubmitReportOpen} onOpenChange={setIsSubmitReportOpen}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Submit Sales Report</DialogTitle>
           </DialogHeader>
           <div className="space-y-4">
             <div>
               <label className="text-sm font-medium">Report Period</label>
               <Select value={newReport.period} onValueChange={(value) => setNewReport(prev => ({ ...prev, period: value }))}>
                 <SelectTrigger>
                   <SelectValue placeholder="Select period" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="today">Today</SelectItem>
                   <SelectItem value="week">This Week (Mon-Sun)</SelectItem>
                   <SelectItem value="month">This Month</SelectItem>
                 </SelectContent>
               </Select>
               <p className="text-xs text-gray-500 mt-1">
                 Automatically calculates date range based on your selection
               </p>
             </div>
             
             <div>
               <label className="text-sm font-medium">Notes (Optional)</label>
               <Textarea
                 value={newReport.notes}
                 onChange={(e) => setNewReport(prev => ({ ...prev, notes: e.target.value }))}
                 placeholder="Additional notes for the report"
                 rows={3}
               />
             </div>

             {/* Preview Section */}
             <div className="border rounded-lg p-3 bg-gray-50">
               <h4 className="text-sm font-medium mb-2">Report Preview</h4>
               <div className="grid grid-cols-2 gap-2 text-xs">
                 <div>
                   <span className="text-gray-600">Period:</span>
                   <span className="ml-2 font-medium capitalize">{newReport.period}</span>
                 </div>
                 <div>
                   <span className="text-gray-600">Floor:</span>
                   <span className="ml-2 font-medium">{userFloor}</span>
                 </div>
                 <div>
                   <span className="text-gray-600">Total Leads:</span>
                   <span className="ml-2 font-medium">{leads.length}</span>
                 </div>
                 <div>
                   <span className="text-gray-600">Total Revenue:</span>
                   <span className="ml-2 font-medium">₹{leads.reduce((sum, l) => sum + (l.amount || 0), 0).toLocaleString()}</span>
                 </div>
               </div>
             </div>
           </div>
           <DialogFooter>
             <Button variant="outline" onClick={() => setIsSubmitReportOpen(false)}>
               Cancel
             </Button>
             <Button onClick={handleSubmitWeeklyReport}>
               Generate & Send Report
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
    </div>
  );
}
