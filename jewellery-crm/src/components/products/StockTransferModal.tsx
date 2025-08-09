'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, ArrowRight, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { apiService } from '@/lib/api-service';
import { useAuth } from '@/hooks/useAuth';

interface StockTransfer {
  id: number;
  from_store: number;
  from_store_name?: string;
  to_store: number;
  to_store_name?: string;
  product: number;
  product_name?: string;
  product_sku?: string;
  quantity: number;
  reason: string;
  requested_by: number;
  requested_by_name?: string;
  approved_by?: number;
  approved_by_name?: string;
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
  transfer_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  store?: number;
  store_name?: string;
  scope: 'global' | 'store';
}

interface Store {
  id: number;
  name: string;
}

interface StockTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StockTransferModal({ isOpen, onClose, onSuccess }: StockTransferModalProps) {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<StockTransfer | null>(null);
  const [createForm, setCreateForm] = useState({
    to_store: '',
    product: '',
    quantity: 0,
    reason: '',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch transfers
      const transfersResponse = await apiService.getStockTransfers();
      if (transfersResponse.success && transfersResponse.data) {
        let transfersData: StockTransfer[] = [];
        if (Array.isArray(transfersResponse.data)) {
          transfersData = transfersResponse.data;
        } else if (typeof transfersResponse.data === 'object' && transfersResponse.data !== null) {
          const data = transfersResponse.data as any;
          if (data.results && Array.isArray(data.results)) {
            transfersData = data.results;
          } else if (data.data && Array.isArray(data.data)) {
            transfersData = data.data;
          }
        }
        setTransfers(transfersData);
      }

      // Fetch products - Get global catalogue for transfer requests
      const productsResponse = await apiService.getProducts({
        scope: 'all' // Get all products (global + store) for transfer requests
      });
      if (productsResponse.success && productsResponse.data) {
        let productsData: Product[] = [];
        if (Array.isArray(productsResponse.data)) {
          productsData = productsResponse.data;
        } else if (typeof productsResponse.data === 'object' && productsResponse.data !== null) {
          const data = productsResponse.data as any;
          if (data.results && Array.isArray(data.results)) {
            productsData = data.results;
          } else if (data.data && Array.isArray(data.data)) {
            productsData = data.data;
          }
        }
        setProducts(productsData);
      }

      // Fetch stores
      const storesResponse = await apiService.getStores();
      if (storesResponse.success && storesResponse.data) {
        let storesData: Store[] = [];
        if (Array.isArray(storesResponse.data)) {
          storesData = storesResponse.data;
        } else if (typeof storesResponse.data === 'object' && storesResponse.data !== null) {
          const data = storesResponse.data as any;
          if (data.results && Array.isArray(data.results)) {
            storesData = data.results;
          } else if (data.data && Array.isArray(data.data)) {
            storesData = data.data;
          }
        }
        // Filter out the current user's store from the destination options
        storesData = storesData.filter(store => store.id !== user?.store);
        setStores(storesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setTransfers([]);
      setProducts([]);
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransfer = async () => {
    try {
      if (!user?.store) {
        console.error('User store not found');
        return;
      }

      const response = await apiService.createStockTransfer({
        from_store: user.store,
        to_store: parseInt(createForm.to_store),
        product: parseInt(createForm.product),
        quantity: createForm.quantity,
        reason: createForm.reason,
        notes: createForm.notes,
        requested_by: user.id,
      });

      if (response.success) {
        setIsCreateModalOpen(false);
        setCreateForm({
          to_store: '',
          product: '',
          quantity: 0,
          reason: '',
          notes: '',
        });
        fetchData();
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating transfer:', error);
    }
  };

  const handleApproveTransfer = async (transferId: number) => {
    try {
      const response = await apiService.approveStockTransfer(transferId.toString());
      if (response.success) {
        fetchData();
        onSuccess();
      }
    } catch (error) {
      console.error('Error approving transfer:', error);
    }
  };

  const handleCompleteTransfer = async (transferId: number) => {
    try {
      const response = await apiService.completeStockTransfer(transferId.toString());
      if (response.success) {
        fetchData();
        onSuccess();
      }
    } catch (error) {
      console.error('Error completing transfer:', error);
    }
  };

  const handleCancelTransfer = async (transferId: number) => {
    try {
      const response = await apiService.cancelStockTransfer(transferId.toString());
      if (response.success) {
        fetchData();
        onSuccess();
      }
    } catch (error) {
      console.error('Error cancelling transfer:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'completed':
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Stock Transfers
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading transfers...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header Actions */}
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Transfer Requests</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage inter-store stock transfers
                  </p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Package className="w-4 h-4 mr-2" />
                  Request Transfer
                </Button>
              </div>

              {/* Transfers List */}
              <div className="space-y-2">
                {transfers.map((transfer) => (
                  <Card key={transfer.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{transfer.product_name}</h4>
                            {getStatusBadge(transfer.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">SKU: {transfer.product_sku}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-sm font-medium">{transfer.from_store_name}</span>
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{transfer.to_store_name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Quantity: {transfer.quantity} | Requested by: {transfer.requested_by_name}
                          </p>
                          {transfer.reason && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Reason: {transfer.reason}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              {formatDate(transfer.created_at)}
                            </p>
                            {transfer.approved_by_name && (
                              <p className="text-xs text-muted-foreground">
                                Approved by: {transfer.approved_by_name}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex gap-1">
                            {transfer.status === 'pending' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleApproveTransfer(transfer.id)}
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCancelTransfer(transfer.id)}
                                >
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Cancel
                                </Button>
                              </>
                            )}
                            {transfer.status === 'approved' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCompleteTransfer(transfer.id)}
                              >
                                <Package className="w-3 h-3 mr-1" />
                                Complete
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {transfers.length === 0 && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center h-32">
                      <Package className="w-8 h-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No transfer requests found</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Transfer Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Stock Transfer</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="to_store">To Store</Label>
              <Select value={createForm.to_store} onValueChange={(value) => setCreateForm({ ...createForm, to_store: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select store" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id.toString()}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="product">Product</Label>
              <Select value={createForm.product} onValueChange={(value) => setCreateForm({ ...createForm, product: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name} ({product.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={createForm.quantity}
                onChange={(e) => setCreateForm({ ...createForm, quantity: parseInt(e.target.value) || 0 })}
              />
            </div>
            
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                value={createForm.reason}
                onChange={(e) => setCreateForm({ ...createForm, reason: e.target.value })}
                placeholder="Why do you need this transfer?"
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={createForm.notes}
                onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                placeholder="Additional notes..."
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTransfer}>
                Request Transfer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 