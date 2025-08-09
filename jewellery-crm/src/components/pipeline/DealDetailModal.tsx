"use client";
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiService, SalesPipeline, Client } from "@/lib/api-service";
import { Edit, Calendar, DollarSign, User, Building, ArrowRight, CheckCircle, XCircle } from "lucide-react";
import { useScopedVisibility } from '@/lib/scoped-visibility';

interface DealDetailModalProps {
  open: boolean;
  onClose: () => void;
  dealId: string | null;
  onDealUpdated: () => void;
}

export function DealDetailModal({ open, onClose, dealId, onDealUpdated }: DealDetailModalProps) {
  const [deal, setDeal] = useState<SalesPipeline | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<{
    title: string;
    expected_value: string;
    probability: string;
    stage: string;
    expected_close_date: string;
    notes: string;
    next_action: string;
    next_action_date: string;
  }>({
    title: '',
    expected_value: '',
    probability: '',
    stage: '',
    expected_close_date: '',
    notes: '',
    next_action: '',
    next_action_date: '',
  });

  // Get user scope for scoped visibility
  const { userScope } = useScopedVisibility();

  useEffect(() => {
    if (open && dealId) {
      fetchDeal();
    }
  }, [open, dealId]);

  const fetchDeal = async () => {
    try {
      setLoading(true);
      
      console.log('Fetching deal with ID:', dealId);
      console.log('User scope:', userScope);
      
      // Use scoped endpoint based on user role
      let response;
      if (userScope.type === 'own') {
        // For salespeople, use the "my" endpoint
        console.log('Using getMyPipeline endpoint for user scope:', userScope.type);
        response = await apiService.getMyPipeline(dealId!);
      } else {
        // For managers and admins, use the regular endpoint (backend middleware handles scoping)
        console.log('Using getPipeline endpoint for user scope:', userScope.type);
        response = await apiService.getPipeline(dealId!);
      }
      
      if (response.success && response.data) {
        setDeal(response.data);
        setFormData({
          title: response.data.title,
          expected_value: response.data.expected_value.toString(),
          probability: response.data.probability.toString(),
          stage: response.data.stage,
          expected_close_date: response.data.expected_close_date || '',
          notes: response.data.notes || '',
          next_action: response.data.next_action || '',
          next_action_date: response.data.next_action_date || '',
        });
        
        // Fetch client details
        if (response.data.client) {
          const clientResponse = await apiService.getClient(response.data.client.toString());
          if (clientResponse.success && clientResponse.data) {
            setClient(clientResponse.data);
          }
        }
      }
    } catch (error: any) {
      console.error('Error fetching deal:', error);
      
      // Handle 404 errors (pipeline not found or no permission)
      if (error.message && error.message.includes('Not found')) {
        console.log('Pipeline not found or access denied - this is expected for scoped visibility');
        // Don't close the modal automatically, just show an error
        // The modal will show "Deal Not Found" message instead
        console.error('Pipeline not found. This might be a data inconsistency issue.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.expected_value) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      
      const pipelineData = {
        title: formData.title,
        expected_value: parseFloat(formData.expected_value),
        probability: parseInt(formData.probability),
        stage: formData.stage,
        expected_close_date: formData.expected_close_date || undefined,
        notes: formData.notes || undefined,
        next_action: formData.next_action || undefined,
        next_action_date: formData.next_action_date || undefined,
      };

      const response = await apiService.updatePipeline(dealId!, pipelineData);
      
      if (response.success) {
        console.log('Deal updated successfully');
        onDealUpdated();
        setIsEditing(false);
        fetchDeal(); // Refresh deal data
      } else {
        console.error('Failed to update deal:', response);
        alert('Failed to update deal. Please try again.');
      }
    } catch (error) {
      console.error('Error updating deal:', error);
      alert('Error updating deal. Please check the console for details.');
    } finally {
      setSaving(false);
    }
  };

  const handleStageTransition = async (newStage: string) => {
    try {
      setSaving(true);
      const response = await apiService.updatePipelineStage(dealId!, { stage: newStage });
      
      if (response.success) {
        console.log('Stage updated successfully');
        onDealUpdated();
        fetchDeal(); // Refresh deal data
      } else {
        console.error('Failed to update stage:', response);
        alert('Failed to update stage. Please try again.');
      }
    } catch (error) {
      console.error('Error updating stage:', error);
      alert('Error updating stage. Please check the console for details.');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const getStageBadgeVariant = (stage: string) => {
    switch (stage) {
      case 'lead': return 'secondary';
      case 'contacted': return 'default';
      case 'qualified': return 'default';
      case 'proposal': return 'default';
      case 'negotiation': return 'default';
      case 'closed_won': return 'default';
      case 'closed_lost': return 'destructive';
      default: return 'outline';
    }
  };

  const stages = [
    { value: 'lead', label: 'Lead', color: 'bg-gray-500' },
    { value: 'contacted', label: 'Contacted', color: 'bg-blue-500' },
    { value: 'qualified', label: 'Qualified', color: 'bg-yellow-500' },
    { value: 'proposal', label: 'Proposal', color: 'bg-orange-500' },
    { value: 'negotiation', label: 'Negotiation', color: 'bg-purple-500' },
    { value: 'closed_won', label: 'Closed Won', color: 'bg-green-500' },
    { value: 'closed_lost', label: 'Closed Lost', color: 'bg-red-500' },
  ];

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Deal Details</DialogTitle>
            <DialogDescription>Loading deal information...</DialogDescription>
          </DialogHeader>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!deal) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Deal Not Found</DialogTitle>
            <DialogDescription>The requested deal could not be found.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                {isEditing ? 'Edit Deal' : 'Deal Details'}
              </DialogTitle>
              <DialogDescription>
                {isEditing ? 'Update deal information' : 'View and manage deal information'}
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Deal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Deal Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expected_value">Expected Value (₹) *</Label>
                  <Input
                    id="expected_value"
                    type="number"
                    value={formData.expected_value}
                    onChange={(e) => handleInputChange('expected_value', e.target.value)}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Stage & Timeline</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stage">Current Stage</Label>
                  <Select value={formData.stage} onValueChange={(value) => handleInputChange('stage', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((stage) => (
                        <SelectItem key={stage.value} value={stage.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
                            {stage.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expected_close_date">Expected Close Date</Label>
                  <Input
                    id="expected_close_date"
                    type="date"
                    value={formData.expected_close_date}
                    onChange={(e) => handleInputChange('expected_close_date', e.target.value)}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Actions & Notes</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="next_action">Next Action</Label>
                  <Input
                    id="next_action"
                    value={formData.next_action}
                    onChange={(e) => handleInputChange('next_action', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="next_action_date">Next Action Date</Label>
                  <Input
                    id="next_action_date"
                    type="datetime-local"
                    value={formData.next_action_date}
                    onChange={(e) => handleInputChange('next_action_date', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </Card>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        ) : (
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Deal Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Title</Label>
                      <p className="text-lg font-semibold">{deal.title}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Expected Value</Label>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(deal.expected_value)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Probability</Label>
                      <p className="text-lg font-semibold">{deal.probability}%</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Stage</Label>
                      <Badge variant={getStageBadgeVariant(deal.stage)} className="capitalize">
                        {deal.stage.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Client Information
                  </h3>
                  {client ? (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Client Name</Label>
                        <p className="text-lg font-semibold">
                          {client.full_name || `${client.first_name} ${client.last_name}`.trim()}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Email</Label>
                        <p className="text-sm">{client.email}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Phone</Label>
                        <p className="text-sm">{client.phone || 'Not provided'}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">Client information not available</p>
                  )}
                </Card>
              </div>

              {deal.notes && (
                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-4">Notes</h3>
                  <p className="text-gray-700">{deal.notes}</p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Timeline
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Created</Label>
                      <p className="text-sm">{formatDate(deal.created_at)}</p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  
                  {deal.expected_close_date && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Expected Close Date</Label>
                        <p className="text-sm">{formatDate(deal.expected_close_date)}</p>
                      </div>
                      <Calendar className="w-5 h-5 text-blue-500" />
                    </div>
                  )}
                  
                  {deal.actual_close_date && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Actual Close Date</Label>
                        <p className="text-sm">{formatDate(deal.actual_close_date)}</p>
                      </div>
                      {deal.stage === 'closed_won' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="actions" className="space-y-4">
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Stage Transitions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {stages.map((stage) => (
                    <Button
                      key={stage.value}
                      variant={deal.stage === stage.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleStageTransition(stage.value)}
                      disabled={saving || deal.stage === stage.value}
                      className="flex items-center gap-2"
                    >
                      <div className={`w-2 h-2 rounded-full ${stage.color}`}></div>
                      {stage.label}
                    </Button>
                  ))}
                </div>
              </Card>

              {deal.next_action && (
                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-4">Next Action</h3>
                  <div className="space-y-2">
                    <p className="text-gray-700">{deal.next_action}</p>
                    {deal.next_action_date && (
                      <p className="text-sm text-gray-500">
                        Due: {formatDate(deal.next_action_date)}
                      </p>
                    )}
                  </div>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
} 