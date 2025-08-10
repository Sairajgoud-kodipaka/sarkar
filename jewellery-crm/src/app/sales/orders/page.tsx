'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingBag, 
  Plus, 
  Filter,
  DollarSign,
  Calendar,
  User,
  Package,
  CheckCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { apiService } from '@/lib/api-service';
import { toast } from 'sonner';

interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'ready_for_delivery' | 'delivered' | 'cancelled' | 'returned';
  payment_status: 'pending' | 'partial' | 'paid' | 'refunded';
  order_date: string;
  delivery_date?: string;
  items_count: number;
  created_at: string;
}

export default function SalesOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customer_name: '',
    customer_phone: '',
    total_amount: 0,
    status: 'confirmed' as Order['status'],
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Load real orders from database
      const response = await apiService.getOrders();
      
      if (response.success && response.data) {
        // Transform API data to match component interface
        const transformedOrders: Order[] = response.data.map((order: any) => ({
          id: order.id,
          order_number: `ORD-${order.id.toString().padStart(4, '0')}`,
          customer_name: order.customer_name,
          customer_phone: order.customer_phone || 'N/A',
          total_amount: order.total_amount,
          status: order.status,
          order_date: order.created_at || order.order_date || new Date().toISOString(),
          created_at: order.created_at,
          items_count: order.order_items ? order.order_items.length : 0,
          payment_status: 'paid', // Default value
          delivery_date: undefined, // Default value
        }));
        
        setOrders(transformedOrders);
      } else {
        setOrders([]);
      }
      
      // Mock data removed - using real API data
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async () => {
    try {
      if (!newOrder.customer_name || !newOrder.customer_phone || !newOrder.total_amount) {
        toast.error('Please fill all required fields');
        return;
      }
      const resp = await apiService.createOrder({
        customer_name: newOrder.customer_name,
        total_amount: newOrder.total_amount,
        status: newOrder.status,
        notes: '',
      } as any);
      if (resp.success) {
        toast.success('Order created');
        setIsCreateOpen(false);
        fetchOrders();
      } else {
        toast.error(resp.message || 'Failed to create order');
      }
    } catch (e) {
      console.error('Create order error', e);
      toast.error('Failed to create order');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'ready_for_delivery': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'returned': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'partial': return 'bg-orange-100 text-orange-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'refunded': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDisplayName = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
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

  const filteredOrders = orders.filter(order => {
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    const matchesPaymentStatus = selectedPaymentStatus === 'all' || order.payment_status === selectedPaymentStatus;
    return matchesStatus && matchesPaymentStatus;
  });

  const totalRevenue = orders.filter(order => order.status === 'delivered').reduce((sum, order) => sum + order.total_amount, 0);
  const pendingOrders = orders.filter(order => order.status === 'pending').length;
  const completedOrders = orders.filter(order => order.status === 'delivered').length;

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600">Manage customer orders and deliveries</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Order
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold text-orange-600">{pendingOrders}</p>
              </div>
              <Package className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Orders</p>
                <p className="text-2xl font-bold text-blue-600">{completedOrders}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-600" />
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
                variant={selectedStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedStatus('all')}
              >
                All Orders
              </Button>
              <Button 
                variant={selectedStatus === 'pending' ? 'default' : 'outline'}
                onClick={() => setSelectedStatus('pending')}
              >
                Pending
              </Button>
              <Button 
                variant={selectedStatus === 'confirmed' ? 'default' : 'outline'}
                onClick={() => setSelectedStatus('confirmed')}
              >
                Confirmed
              </Button>
              <Button 
                variant={selectedStatus === 'delivered' ? 'default' : 'outline'}
                onClick={() => setSelectedStatus('delivered')}
              >
                Delivered
              </Button>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedPaymentStatus}
                onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Payment Status</option>
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
                <option value="refunded">Refunded</option>
              </select>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Order Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Customer Name</label>
              <Input value={newOrder.customer_name} onChange={(e) => setNewOrder({ ...newOrder, customer_name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Customer Phone</label>
              <Input value={newOrder.customer_phone} onChange={(e) => setNewOrder({ ...newOrder, customer_phone: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Total Amount</label>
              <Input type="number" value={newOrder.total_amount} onChange={(e) => setNewOrder({ ...newOrder, total_amount: Number(e.target.value) })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateOrder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Order List</CardTitle>
          <CardDescription>
            {filteredOrders.length} orders found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading orders...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{order.order_number}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          {order.customer_name}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          Ordered: {formatDate(order.order_date)}
                        </span>
                        <span className="flex items-center">
                          <Package className="w-4 h-4 mr-1" />
                          {order.items_count} items
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Phone: {order.customer_phone}
                        {order.delivery_date && ` • Delivery: ${formatDate(order.delivery_date)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(order.total_amount)}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusDisplayName(order.status)}
                        </Badge>
                        <Badge className={getPaymentStatusColor(order.payment_status)}>
                          {order.payment_status}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedOrder(order);
                        setIsDetailsOpen(true);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
              
              {filteredOrders.length === 0 && !loading && (
                <div className="text-center py-8">
                  <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                  <p className="text-gray-600">Try adjusting your filters or create a new order</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>Review order information</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-2 text-sm">
              <div className="font-semibold text-base">{selectedOrder.order_number}</div>
              <div>Customer: {selectedOrder.customer_name}</div>
              {selectedOrder.customer_phone && (<div>Phone: {selectedOrder.customer_phone}</div>)}
              <div>Amount: {formatCurrency(selectedOrder.total_amount)}</div>
              <div>Status: <span className={`inline-block px-2 py-0.5 rounded ${getStatusColor(selectedOrder.status)}`}>{getStatusDisplayName(selectedOrder.status)}</span></div>
              {selectedOrder.delivery_date && (<div>Delivery: {formatDate(selectedOrder.delivery_date)}</div>)}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}