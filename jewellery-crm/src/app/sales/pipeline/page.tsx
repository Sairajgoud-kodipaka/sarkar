'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  TrendingUp, 
  Plus, 
  Target,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  Eye,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { apiService } from '@/lib/api-service';
import { supabase } from '@/lib/supabase';

interface Lead {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  product_interest: string;
  budget_range: string;
  stage: 'potential' | 'demo' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  floor: number;
  created_at: string;
  last_updated: string;
  notes?: string;
  assigned_to?: string;
}

interface Sale {
  id: string;
  lead_id?: string;
  customer_name: string;
  product_sold: string;
  sale_amount: number;
  sale_date: string;
  commission: number;
  notes?: string;
  salesperson_id?: string;
  floor: number;
  store_id?: number;
  created_at: string;
}

export default function SalesPipelinePage() {
  console.log('🚀 SalesPipelinePage component loaded');
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConvertToSaleOpen, setIsConvertToSaleOpen] = useState(false);
  const [isViewLeadOpen, setIsViewLeadOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  const [newSale, setNewSale] = useState({
    product_sold: '',
    sale_amount: '',
    notes: ''
  });

  useEffect(() => {
    console.log('🔄 useEffect triggered, calling fetchPipelineData');
    fetchPipelineData();
  }, []);

  const fetchPipelineData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching pipeline data...');
      
      // Get current user info
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 Current user:', user);
      
      if (!user) {
        console.warn('⚠️ No user logged in');
        setLeads([]);
        setSales([]);
        return;
      }
      
      // Fetch real data from API
      const [leadsResponse, salesResponse] = await Promise.all([
        apiService.getLeads({ assigned_to: user.id }),
        apiService.getSales({ floor: 1 }) // TODO: Get user's actual floor
      ]);
      
      console.log('📊 Leads response:', leadsResponse);
      console.log('💰 Sales response:', salesResponse);
      
      if (leadsResponse.success) {
        setLeads(leadsResponse.data || []);
        console.log('✅ Leads loaded:', leadsResponse.data?.length || 0);
      } else {
        console.error('❌ Error fetching leads:', leadsResponse.message);
        setLeads([]);
      }
      
      if (salesResponse.success) {
        // Transform API sales data to match page interface
        const transformedSales: Sale[] = (salesResponse.data || []).map((sale: any) => ({
          id: sale.id.toString(),
          customer_name: sale.customer_name,
          product_sold: 'Product', // Default since API doesn't have this field
          sale_amount: sale.amount,
          sale_date: sale.date,
          commission: sale.amount * 0.02, // Calculate 2% commission
          notes: '',
          salesperson_id: sale.created_by,
          floor: sale.floor,
          store_id: sale.store_id,
          created_at: sale.created_at
        }));
        setSales(transformedSales);
        console.log('✅ Sales loaded:', transformedSales.length);
      } else {
        console.error('❌ Error fetching sales:', salesResponse.message);
        setSales([]);
      }
      
    } catch (error) {
      console.error('💥 Error fetching pipeline data:', error);
      setLeads([]);
      setSales([]);
    } finally {
      setLoading(false);
      console.log('🏁 Pipeline data fetch completed');
    }
  };

  const handleStageChange = async (leadId: string, newStage: Lead['stage']) => {
    try {
      // Use real API call
      const response = await apiService.updateLeadStage(leadId, newStage);
      
      if (response.success) {
        // Update local state with the response data
        setLeads(prev => prev.map(lead => 
          lead.id === leadId 
            ? { ...lead, stage: newStage, last_updated: new Date().toISOString() }
            : lead
        ));
      } else {
        console.error('Error updating lead stage:', response.message);
      }
    } catch (error) {
      console.error('Error updating lead stage:', error);
    }
  };

  const handleConvertToSale = async () => {
    if (!selectedLead) return;

    try {
      // Use real API call to convert lead to sale
      const response = await apiService.convertLeadToSale(selectedLead.id, {
        product_sold: newSale.product_sold,
        sale_amount: parseFloat(newSale.sale_amount),
        notes: newSale.notes
      });
      
      if (response.success) {
        // Add the new sale to the list
        const saleData: Sale = {
          id: response.data.id || Date.now().toString(),
          lead_id: selectedLead.id,
          customer_name: selectedLead.customer_name,
          product_sold: newSale.product_sold,
          sale_amount: parseFloat(newSale.sale_amount),
          sale_date: new Date().toISOString(),
          commission: parseFloat(newSale.sale_amount) * 0.02, // 2% commission
          notes: newSale.notes,
          floor: selectedLead.floor,
          created_at: new Date().toISOString()
        };

        setSales(prev => [saleData, ...prev]);
        
        // Update lead stage to closed_won
        setLeads(prev => prev.map(lead => 
          lead.id === selectedLead.id 
            ? { ...lead, stage: 'closed_won', last_updated: new Date().toISOString() }
            : lead
        ));

        setIsConvertToSaleOpen(false);
        setSelectedLead(null);
        setNewSale({
          product_sold: '',
          sale_amount: '',
          notes: ''
        });
      } else {
        console.error('Error converting lead to sale:', response.message);
      }
    } catch (error) {
      console.error('Error converting lead to sale:', error);
    }
  };

  const getPipelineStages = (): { id: string; name: string; leads: Lead[]; color: string }[] => {
    const stages: { id: string; name: string; leads: Lead[]; color: string }[] = [
      { id: 'potential', name: 'Potential', leads: [], color: 'bg-blue-100 border-blue-300' },
      { id: 'demo', name: 'Demo', leads: [], color: 'bg-yellow-100 border-yellow-300' },
      { id: 'proposal', name: 'Proposal', leads: [], color: 'bg-purple-100 border-purple-300' },
      { id: 'negotiation', name: 'Negotiation', leads: [], color: 'bg-orange-100 border-orange-300' },
      { id: 'closed_won', name: 'Closed Won', leads: [], color: 'bg-green-100 border-green-300' },
      { id: 'closed_lost', name: 'Closed Lost', leads: [], color: 'bg-red-100 border-red-300' }
    ];

    // Group leads by stage
    leads.forEach(lead => {
      const stage = stages.find(s => s.id === lead.stage);
      if (stage) {
        stage.leads.push(lead);
      }
    });

    return stages;
  };

  const getStats = () => {
    const stages = getPipelineStages();
    return {
      total_leads: leads.length,
      total_sales: sales.length,
      total_revenue: sales.reduce((sum, sale) => sum + sale.sale_amount, 0),
      total_commission: sales.reduce((sum, sale) => sum + sale.commission, 0),
      potential: stages.find(s => s.id === 'potential')?.leads.length || 0,
      demo: stages.find(s => s.id === 'demo')?.leads.length || 0,
      proposal: stages.find(s => s.id === 'proposal')?.leads.length || 0,
      negotiation: stages.find(s => s.id === 'negotiation')?.leads.length || 0,
      closed_won: stages.find(s => s.id === 'closed_won')?.leads.length || 0,
      closed_lost: stages.find(s => s.id === 'closed_lost')?.leads.length || 0
    };
  };

  const stats = getStats();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading pipeline data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Sales Pipeline</h1>
          <p className="text-gray-600">Manage your leads and convert them to sales</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm font-medium text-gray-600">Total Leads</p>
            <p className="text-2xl font-bold text-blue-600">{stats.total_leads}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm font-medium text-gray-600">Total Sales</p>
            <p className="text-2xl font-bold text-green-600">{stats.total_sales}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm font-medium text-gray-600">Revenue</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.total_revenue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm font-medium text-gray-600">Commission</p>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.total_commission)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
            <p className="text-2xl font-bold text-orange-600">
              {stats.total_leads > 0 ? ((stats.closed_won / stats.total_leads) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>
      
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm font-medium text-gray-600">Active Leads</p>
            <p className="text-2xl font-bold text-blue-600">
              {stats.potential + stats.demo + stats.proposal + stats.negotiation}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Sales */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
          <CardDescription>Your successful conversions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sales.map((sale) => (
              <div key={sale.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{sale.customer_name}</h3>
                    <p className="text-gray-600">{sale.product_sold}</p>
                    <p className="text-sm text-gray-500">Sold on {formatDate(sale.sale_date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(sale.sale_amount)}</p>
                    <p className="text-sm text-purple-600">Commission: {formatCurrency(sale.commission)}</p>
                  </div>
                </div>
                {sale.notes && (
                  <p className="text-sm text-gray-600 mt-2">{sale.notes}</p>
                )}
              </div>
            ))}
            
            {sales.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No sales yet. Start converting your leads!
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Board */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Stages</CardTitle>
          <CardDescription>Track your leads through the sales process</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {getPipelineStages().map((stage) => (
              <div key={stage.id} className={`border-2 rounded-lg p-4 ${stage.color}`}>
                <h3 className="font-semibold text-lg mb-3 text-center">{stage.name}</h3>
                <div className="space-y-2">
                  {stage.leads.map((lead) => (
                    <div key={lead.id} className="bg-white rounded-lg p-3 border shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">
                          <span className="text-gray-500">cust_name:</span> {lead.customer_name}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {lead.stage}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mb-1">
                        <span className="text-gray-500">assigned:</span> {lead.assigned_to || 'Unassigned'}
                      </p>
                      <p className="text-xs text-gray-600 mb-2">{lead.product_interest}</p>
                      <p className="text-xs text-gray-600 mb-2">{lead.budget_range}</p>
                      
                      <div className="flex gap-1">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 text-xs"
                          onClick={() => {
                            setSelectedLead(lead);
                            setIsViewLeadOpen(true);
                          }}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        
                        {lead.stage === 'proposal' && (
                          <Button 
                            size="sm" 
                            className="flex-1 text-xs bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              setSelectedLead(lead);
                              setIsConvertToSaleOpen(true);
                            }}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Convert
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {stage.leads.length === 0 && (
                    <div className="text-center text-gray-500 text-sm py-4">
                      No leads
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Convert to Sale Dialog */}
      <Dialog open={isConvertToSaleOpen} onOpenChange={setIsConvertToSaleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert Lead to Sale</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedLead && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm"><strong>Customer:</strong> {selectedLead.customer_name}</p>
                <p className="text-sm"><strong>Interest:</strong> {selectedLead.product_interest}</p>
                <p className="text-sm"><strong>Budget:</strong> {selectedLead.budget_range}</p>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium">Product Sold</label>
              <Input
                value={newSale.product_sold}
                onChange={(e) => setNewSale(prev => ({ ...prev, product_sold: e.target.value }))}
                placeholder="Enter the product that was sold"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Sale Amount (₹)</label>
              <Input
                type="number"
                value={newSale.sale_amount}
                onChange={(e) => setNewSale(prev => ({ ...prev, sale_amount: e.target.value }))}
                placeholder="Enter sale amount"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Notes (Optional)</label>
              <Input
                value={newSale.notes}
                onChange={(e) => setNewSale(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about the sale"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConvertToSaleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConvertToSale} disabled={!newSale.product_sold || !newSale.sale_amount}>
              Convert to Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Lead Dialog */}
      <Dialog open={isViewLeadOpen} onOpenChange={setIsViewLeadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{selectedLead.customer_name}</h3>
                <Badge variant={selectedLead.stage === 'closed_won' ? 'default' : 'secondary'}>
                  {selectedLead.stage.charAt(0).toUpperCase() + selectedLead.stage.slice(1)}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span>{selectedLead.customer_phone}</span>
                </div>
                
                {selectedLead.customer_email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span>{selectedLead.customer_email}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span>Floor {selectedLead.floor}</span>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-600"><strong>Product Interest:</strong></p>
                <p className="text-sm">{selectedLead.product_interest}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600"><strong>Budget Range:</strong></p>
                <p className="text-sm">{selectedLead.budget_range}</p>
              </div>
              
              {selectedLead.notes && (
                <div>
                  <p className="text-sm text-gray-600"><strong>Notes:</strong></p>
                  <p className="text-sm">{selectedLead.notes}</p>
                </div>
              )}
              
              <div className="pt-4 border-t">
                <p className="text-xs text-gray-500">
                  <strong>Created:</strong> {formatDate(selectedLead.created_at)}
                </p>
                <p className="text-xs text-gray-500">
                  <strong>Last Updated:</strong> {formatDate(selectedLead.last_updated)}
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewLeadOpen(false)}>
              Close
            </Button>
            {selectedLead && selectedLead.stage === 'proposal' && (
              <Button onClick={() => {
                setIsViewLeadOpen(false);
                setIsConvertToSaleOpen(true);
              }}>
                Convert to Sale
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}