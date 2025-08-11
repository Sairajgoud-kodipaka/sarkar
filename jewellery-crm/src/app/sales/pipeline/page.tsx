'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Plus, 
  Filter,
  DollarSign,
  Calendar,
  User,
  Target
} from 'lucide-react';
import { apiService } from '@/lib/api-service';
import { DragEvent, useCallback } from 'react';
import { toast } from 'sonner';
import { AddDealModal } from '@/components/pipeline/AddDealModal';
import { useFloor } from '@/contexts/FloorContext';
import { DealDetailModal } from '@/components/pipeline/DealDetailModal';

interface PipelineDeal {
  id: number;
  title: string;
  customer_name: string;
  amount: number;
  stage: 'lead' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  probability: number;
  expected_close_date: string;
  assigned_to?: string;
  floor?: number;
  notes?: string;
  created_at: string;
  team_members?: {
    first_name: string;
    last_name: string;
  };
}

export default function SalesPipelinePage() {
  const { currentFloor, isFloorManager } = useFloor();
  const [deals, setDeals] = useState<PipelineDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [isDealOpen, setIsDealOpen] = useState(false);

  useEffect(() => {
    fetchPipelineData();
  }, [selectedStage, currentFloor?.name]);

  const fetchPipelineData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getDeals({
        stage: selectedStage === 'all' ? undefined : selectedStage,
        floor: isFloorManager && currentFloor ? Number(currentFloor.name?.match(/\d+/)?.[0]) : undefined,
      });
      
      if (response.success) {
        setDeals(response.data);
      } else {
        setError('Failed to load pipeline data');
        toast.error('Failed to load pipeline data');
      }
    } catch (error) {
      console.error('Error fetching pipeline data:', error);
      setError('Failed to load pipeline data. The deals table may not exist yet.');
      toast.error('Pipeline feature requires schema extension');
    } finally {
      setLoading(false);
    }
  };

  // Mock data removed - using real API data

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'lead': return 'bg-gray-100 text-gray-800';
      case 'contacted': return 'bg-blue-100 text-blue-800';
      case 'qualified': return 'bg-yellow-100 text-yellow-800';
      case 'proposal': return 'bg-orange-100 text-orange-800';
      case 'negotiation': return 'bg-purple-100 text-purple-800';
      case 'closed_won': return 'bg-green-100 text-green-800';
      case 'closed_lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStageDisplayName = (stage: string) => {
    return stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
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
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const filteredDeals = selectedStage === 'all' 
    ? deals 
    : deals.filter(deal => deal.stage === selectedStage);

  const totalValue = deals.reduce((sum, deal) => sum + deal.amount, 0);
  const wonValue = deals.filter(deal => deal.stage === 'closed_won').reduce((sum, deal) => sum + deal.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pipeline data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500 mb-4">
            To enable the Sales Pipeline feature, run the schema extension:
            <code className="block mt-2 p-2 bg-gray-100 rounded">
              schema-extensions.sql
            </code>
          </p>
          <Button onClick={fetchPipelineData}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Pipeline</h1>
          <p className="text-gray-600">Track and manage your sales opportunities</p>
          </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Deal
        </Button>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pipeline Value</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Won Value</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(wonValue)}</p>
          </div>
              <Target className="w-8 h-8 text-green-600" />
        </div>
          </CardContent>
      </Card>
      
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Deals</p>
                <p className="text-2xl font-bold text-gray-900">{deals.length}</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex gap-2">
              <Button 
                variant={selectedStage === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedStage('all')}
              >
                All Stages
              </Button>
              <Button 
                variant={selectedStage === 'lead' ? 'default' : 'outline'}
                onClick={() => setSelectedStage('lead')}
              >
                Leads
              </Button>
              <Button 
                variant={selectedStage === 'qualified' ? 'default' : 'outline'}
                onClick={() => setSelectedStage('qualified')}
              >
                Qualified
              </Button>
              <Button 
                variant={selectedStage === 'proposal' ? 'default' : 'outline'}
                onClick={() => setSelectedStage('proposal')}
              >
                Proposal
              </Button>
              <Button 
                variant={selectedStage === 'negotiation' ? 'default' : 'outline'}
                onClick={() => setSelectedStage('negotiation')}
              >
                Negotiation
              </Button>
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
              </div>
        </CardContent>
            </Card>

      {/* Kanban Board */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Board</CardTitle>
          <CardDescription>Visualize deals by stage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {['lead','qualified','proposal','negotiation'].map((stageKey) => (
              <div
                key={stageKey}
                className="bg-gray-50 rounded-lg p-3 border"
                onDragOver={(e) => e.preventDefault()}
                onDrop={async (e) => {
                  const dealId = e.dataTransfer.getData('text/deal-id');
                  if (!dealId) return;
                  try {
                    await apiService.updatePipelineStage(dealId, { stage: stageKey });
                    fetchPipelineData();
                  } catch (err) {
                    console.error('Failed to move deal', err);
                  }
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold capitalize">{stageKey.replace('_',' ')}</div>
                  <Badge className={getStageColor(stageKey)}>{filteredDeals.filter(d=>d.stage===stageKey).length}</Badge>
                </div>
                <div className="space-y-2 min-h-[120px]">
                  {filteredDeals.filter(d => d.stage === stageKey).map(deal => (
                    <div
                      key={deal.id}
                      className="bg-white rounded-md border p-3 shadow-sm hover:shadow cursor-pointer"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/deal-id', String(deal.id));
                      }}
                      onClick={() => { setSelectedDealId(String(deal.id)); setIsDealOpen(true); }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm truncate">{deal.title}</div>
                        <div className="text-xs text-gray-600">{formatCurrency(deal.amount)}</div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                        <User className="w-3 h-3" /> {deal.customer_name}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">Close: {formatDate(deal.expected_close_date)}</div>
                    </div>
                  ))}
                  {filteredDeals.filter(d => d.stage === stageKey).length === 0 && (
                    <div className="text-xs text-gray-400">No deals</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

        {/* Modals */}
        <AddDealModal
          open={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          onDealCreated={() => fetchPipelineData()}
        />
        <DealDetailModal
          open={isDealOpen}
          onClose={() => setIsDealOpen(false)}
          dealId={selectedDealId}
          onDealUpdated={() => fetchPipelineData()}
        />
    </div>
  );
}