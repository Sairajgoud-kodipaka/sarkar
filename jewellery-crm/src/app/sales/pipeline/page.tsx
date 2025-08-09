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
import { toast } from 'sonner';

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
  const [deals, setDeals] = useState<PipelineDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<string>('all');

  useEffect(() => {
    fetchPipelineData();
  }, [selectedStage]);

  const fetchPipelineData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getDeals({
        stage: selectedStage === 'all' ? undefined : selectedStage
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

  // OLD MOCK DATA - REPLACED WITH REAL API
  /*
  const mockDeals: PipelineDeal[] = [
        {
          id: 1,
          title: 'Gold Necklace Sale',
          customer_name: 'Priya Sharma',
          amount: 75000,
          stage: 'qualified',
          probability: 75,
          expected_close_date: '2024-01-15',
          assigned_to: 'Sales Team',
          created_at: '2024-01-01'
        },
        {
          id: 2,
          title: 'Diamond Ring Purchase',
          customer_name: 'Rajesh Kumar',
          amount: 120000,
          stage: 'negotiation',
          probability: 90,
          expected_close_date: '2024-01-20',
          assigned_to: 'Sales Team',
          created_at: '2024-01-05'
        },
        {
          id: 3,
          title: 'Wedding Collection',
          customer_name: 'Anita Patel',
          amount: 250000,
          stage: 'proposal',
          probability: 60,
          expected_close_date: '2024-02-01',
          assigned_to: 'Sales Team',
          created_at: '2024-01-10'
  ];
  */

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
        <Button>
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

      {/* Deals List */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Deals</CardTitle>
          <CardDescription>
            {filteredDeals.length} deals found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading pipeline...</span>
        </div>
          ) : (
            <div className="space-y-4">
              {filteredDeals.map((deal) => (
                <div
                  key={deal.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-blue-600" />
      </div>
                  <div>
                      <h3 className="font-semibold text-gray-900">{deal.title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          {deal.customer_name}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          Close: {formatDate(deal.expected_close_date)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Probability: {deal.probability}% • Assigned to: {deal.assigned_to}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(deal.amount)}</p>
                      <Badge className={getStageColor(deal.stage)}>
                        {getStageDisplayName(deal.stage)}
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
              
              {filteredDeals.length === 0 && !loading && (
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No deals found</h3>
                  <p className="text-gray-600">Try adjusting your filters or add a new deal</p>
                </div>
            )}
          </div>
          )}
        </CardContent>
        </Card>
    </div>
  );
}