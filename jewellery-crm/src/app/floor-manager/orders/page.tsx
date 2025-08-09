'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ShoppingBag, 
  DollarSign, 
  Search, 
  Plus, 
  Filter,
  Package,
  Truck,
  CheckCircle,
  Clock,
  Eye,
  XCircle,
  Calendar,
  Edit
} from 'lucide-react';
import { apiService } from '@/lib/api-service';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';

interface Order {
  id: number;
  customer_name: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  floor?: number | null;
  notes?: string | null;
  created_at: string;
}

export default function FloorManagerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ customer_name: '', total_amount: '' as any, status: 'pending', floor: '' as any, notes: '' });
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editForm, setEditForm] = useState({
    customer_name: '',
    total_amount: '' as unknown as number | string,
    status: 'pending' as Order['status'],
    floor: '' as unknown as number | string,
    notes: ''
  });

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  useEffect(() => {
    const channel = supabase
      .channel('floor-orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await apiService.getOrders({ status: statusFilter });
      setOrders((res.data || []) as any);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setEditForm({
      customer_name: order.customer_name,
      total_amount: order.total_amount,
      status: order.status,
      floor: order.floor || '',
      notes: order.notes || ''
    });
    setIsEditOpen(true);
  };

  const handleUpdateOrder = async () => {
    if (!editingOrder) return;
    
    try {
      const total = typeof editForm.total_amount === 'string' ? parseFloat(editForm.total_amount) : editForm.total_amount;
      
      const res = await apiService.updateOrder(editingOrder.id, {
        customer_name: editForm.customer_name,
        total_amount: total,
        status: editForm.status,
        notes: editForm.notes || undefined,
      });
      
      if (res.success) {
        setIsEditOpen(false);
        setEditingOrder(null);
        setEditForm({ customer_name: '', total_amount: '' as any, status: 'pending', floor: '' as any, notes: '' });
        fetchOrders();
      }
    } catch (e) {
      console.error('Update order failed', e);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-orange-100 text-orange-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // payment status indicator removed

  const filteredOrders = orders.filter(order => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = order.customer_name.toLowerCase().includes(q) || String(order.id).includes(q) || (order.notes || '').toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const processingOrders = orders.filter(o => o.status === 'processing');
  const readyOrders = orders.filter(o => o.status === 'shipped' || o.status === 'confirmed');
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Floor Orders</h1>
          <p className="text-gray-600">Manage orders on your floor</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Order
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              </div>
              <ShoppingBag className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Processing</p>
                <p className="text-2xl font-bold text-orange-600">{processingOrders.length}</p>
              </div>
              <Package className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ready for Delivery</p>
                <p className="text-2xl font-bold text-green-600">{readyOrders.length}</p>
              </div>
              <Truck className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalRevenue)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
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
                  placeholder="Search orders..."
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
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="ready">Ready</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Order #{order.id}</h3>
                      <p className="text-sm text-gray-600">{order.customer_name}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(order.created_at).toLocaleDateString('en-IN')}
                        </span>
                        <span className="flex items-center">
                          <Package className="w-4 h-4 mr-1" />
                          Items via order_items
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(order.total_amount)}
                      </p>
                      <p className="text-sm text-gray-600">Total</p>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status.toUpperCase()}
                    </Badge>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => setViewingOrder(order)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(order)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      {order.status !== 'cancelled' && (
                        <Button variant="outline" size="sm" onClick={async () => { await apiService.updateOrder(order.id, { status: 'cancelled' }); fetchOrders(); }}>
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium text-gray-600">Items:</span>
                      <div className="mt-1 space-y-1 text-sm text-gray-500">Use order_items table</div>
                    </div>
                    <div className="space-y-2">
                      
                      {order.notes && (
                        <p className="text-sm">
                          <span className="font-medium text-gray-600">Notes:</span> {order.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Order Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600">Customer name</label>
              <Input value={editForm.customer_name} onChange={(e) => setEditForm({ ...editForm, customer_name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-gray-600">Total amount (INR)</label>
              <Input type="number" value={editForm.total_amount as any} onChange={(e) => setEditForm({ ...editForm, total_amount: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-gray-600">Status</label>
              <select className="w-full border rounded px-2 py-2" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600">Floor (optional)</label>
              <Input type="number" value={editForm.floor as any} onChange={(e) => setEditForm({ ...editForm, floor: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-gray-600">Notes (optional)</label>
              <Input value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateOrder}>Update Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Order Modal */}
      <Dialog open={!!viewingOrder} onOpenChange={(open) => !open && setViewingOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {viewingOrder && (
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-600">ID:</span> <span className="font-medium">{viewingOrder.id}</span></div>
              <div><span className="text-gray-600">Customer:</span> <span className="font-medium">{viewingOrder.customer_name}</span></div>
              <div><span className="text-gray-600">Amount:</span> <span className="font-medium">{formatCurrency(viewingOrder.total_amount)}</span></div>
              <div><span className="text-gray-600">Status:</span> <span className="font-medium">{viewingOrder.status}</span></div>
              <div><span className="text-gray-600">Created:</span> <span className="font-medium">{new Date(viewingOrder.created_at).toLocaleDateString()}</span></div>
              {viewingOrder.notes && (
                <div><span className="text-gray-600">Notes:</span> <span className="font-medium">{viewingOrder.notes}</span></div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingOrder(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
      
// Create Order Modal
// Appending modal at end to avoid layout churn
export function CreateOrderModal({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; onCreated: () => void }) {
  const [customerName, setCustomerName] = React.useState('');
  const [totalAmount, setTotalAmount] = React.useState('');
  const [status, setStatus] = React.useState<'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'>('pending');
  const [floor, setFloor] = React.useState('');
  const [notes, setNotes] = React.useState('');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Order</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-600">Customer name</label>
            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Total amount (INR)</label>
            <Input type="number" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Status</label>
            <select className="w-full border rounded px-2 py-2" value={status} onChange={(e) => setStatus(e.target.value as any)}>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600">Floor (optional)</label>
            <Input type="number" value={floor} onChange={(e) => setFloor(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Notes (optional)</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={async () => {
            const total = Number(totalAmount);
            if (!customerName || isNaN(total)) return;
            const res = await apiService.createOrder({ customer_name: customerName, total_amount: total, status, floor: floor ? Number(floor) : undefined, notes: notes || undefined });
            if (res.success) {
              onOpenChange(false);
              onCreated();
            }
          }}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
