'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Download, Search, Loader2, Plus, Eye, XCircle, Edit } from 'lucide-react';
import { apiService } from '@/lib/api-service';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';

type OrderRecord = {
  id: number;
  customer_id?: number | null;
  customer_name: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  floor?: number | null;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    customer_name: '',
    total_amount: '' as unknown as number | string,
    status: 'pending' as OrderRecord['status'],
    floor: '' as unknown as number | string,
    notes: ''
  });

  const [viewingOrder, setViewingOrder] = useState<OrderRecord | null>(null);
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<OrderRecord | null>(null);
  const [editForm, setEditForm] = useState({
    customer_name: '',
    total_amount: '' as unknown as number | string,
    status: 'pending' as OrderRecord['status'],
    floor: '' as unknown as number | string,
    notes: ''
  });

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  useEffect(() => {
    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await apiService.getOrders({ status: statusFilter });
      if (response.success) {
        const list = (response.data || []) as OrderRecord[];
        setOrders(list);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return orders.filter((o) => {
      const matchesSearch = !q ||
        o.customer_name.toLowerCase().includes(q) ||
        String(o.id).includes(q) ||
        (o.notes || '').toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = filteredOrders.length;
    const pending = filteredOrders.filter(o => o.status === 'pending').length;
    const completed = filteredOrders.filter(o => o.status === 'delivered').length;
    const cancelled = filteredOrders.filter(o => o.status === 'cancelled').length;
    return { total, pending, completed, cancelled };
  }, [filteredOrders]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-indigo-100 text-indigo-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    const cls = map[status] || 'bg-gray-100 text-gray-800';
    return <Badge className={cls}>{status[0].toUpperCase() + status.slice(1)}</Badge>;
  };

  const handleCreate = async () => {
    try {
      const total = Number(createForm.total_amount);
      const floor = createForm.floor ? Number(createForm.floor) : undefined;
      if (!createForm.customer_name || isNaN(total)) return;
      const res = await apiService.createOrder({
        customer_name: createForm.customer_name,
        total_amount: total,
        status: createForm.status,
        floor,
        notes: createForm.notes || undefined,
      });
      if (res.success) {
        setIsCreateOpen(false);
        setCreateForm({ customer_name: '', total_amount: '' as any, status: 'pending', floor: '' as any, notes: '' });
        fetchOrders();
      }
    } catch (e) {
      console.error('Create order failed', e);
    }
  };

  const handleCancel = async (orderId: number) => {
    try {
      await apiService.updateOrder(orderId, { status: 'cancelled' });
      fetchOrders();
    } catch (e) {
      console.error('Cancel order failed', e);
    }
  };

  const handleEdit = (order: OrderRecord) => {
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
      const floor = typeof editForm.floor === 'string' && editForm.floor !== '' ? parseInt(editForm.floor) : undefined;
      
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

  const handleExport = () => {
    try {
      // Filter orders based on current search and status filter
      const dataToExport = filteredOrders.map(order => ({
        'Order ID': order.id,
        'Customer Name': order.customer_name,
        'Status': order.status,
        'Total Amount': order.total_amount,
        'Floor': order.floor || 'N/A',
        'Notes': order.notes || '',
        'Created Date': formatDate(order.created_at),
        'Updated Date': order.updated_at ? formatDate(order.updated_at) : 'N/A'
      }));

      // Convert to CSV
      const headers = Object.keys(dataToExport[0] || {});
      const csvContent = [
        headers.join(','),
        ...dataToExport.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row];
            // Escape commas and quotes in CSV
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading orders...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Orders</h1>
          <p className="text-text-secondary mt-1">View and manage all orders</p>
        </div>
        <div className="flex gap-2 items-center">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-1" /> Export
          </Button>
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> New Order
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="flex flex-col gap-1 p-5">
          <div className="text-xl font-bold text-text-primary">{stats.total}</div>
          <div className="text-sm text-text-secondary font-medium">Total Orders</div>
        </Card>
        <Card className="flex flex-col gap-1 p-5">
          <div className="text-xl font-bold text-text-primary">{stats.pending}</div>
          <div className="text-sm text-text-secondary font-medium">Pending</div>
        </Card>
        <Card className="flex flex-col gap-1 p-5">
          <div className="text-xl font-bold text-text-primary">{stats.completed}</div>
          <div className="text-sm text-text-secondary font-medium">Delivered</div>
        </Card>
        <Card className="flex flex-col gap-1 p-5">
          <div className="text-xl font-bold text-text-primary">{stats.cancelled}</div>
          <div className="text-sm text-text-secondary font-medium">Cancelled</div>
        </Card>
      </div>

      <Card className="p-4 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="font-semibold text-text-primary">
            Orders <span className="text-text-muted font-normal">Total: {filteredOrders.length} orders</span>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order ID, customer or notes..."
              className="w-full md:w-80 pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border bg-white mt-2">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">ID</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Customer</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Status</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Amount</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Date</th>
                <th className="px-4 py-2 text-left font-semibold text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">No orders found</td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="border-t border-border hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-text-primary">{order.id}</td>
                    <td className="px-4 py-2 text-text-primary">{order.customer_name}</td>
                    <td className="px-4 py-2">{getStatusBadge(order.status)}</td>
                    <td className="px-4 py-2 text-text-primary">{formatCurrency(order.total_amount)}</td>
                    <td className="px-4 py-2 text-text-secondary">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-2 flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setViewingOrder(order)}>
                        <Eye className="w-4 h-4 mr-1" /> View
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(order)}>
                        <Edit className="w-4 h-4 mr-1" /> Edit
                      </Button>
                      {order.status !== 'cancelled' && (
                        <Button variant="outline" size="sm" onClick={() => handleCancel(order.id)}>
                          <XCircle className="w-4 h-4 mr-1" /> Cancel
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Order Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600">Customer name</label>
              <Input value={createForm.customer_name} onChange={(e) => setCreateForm({ ...createForm, customer_name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-gray-600">Total amount (INR)</label>
              <Input type="number" value={createForm.total_amount as any} onChange={(e) => setCreateForm({ ...createForm, total_amount: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-gray-600">Status</label>
              <Select value={createForm.status} onValueChange={(v) => setCreateForm({ ...createForm, status: v as OrderRecord['status'] })}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-gray-600">Floor (optional)</label>
              <Input type="number" value={createForm.floor as any} onChange={(e) => setCreateForm({ ...createForm, floor: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-gray-600">Notes (optional)</label>
              <Input value={createForm.notes} onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Close</Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v as OrderRecord['status'] })}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
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
              <div><span className="text-gray-600">Created:</span> <span className="font-medium">{formatDate(viewingOrder.created_at)}</span></div>
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
 
 