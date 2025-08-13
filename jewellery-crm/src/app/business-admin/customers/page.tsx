 'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Search, Download, Upload, Plus, Filter, MoreHorizontal, Eye, Edit, Trash2, UserPlus } from 'lucide-react';
import { apiService } from '@/lib/api-service';
import { useAuth } from '@/hooks/useAuth';
import AddCustomerModal from '@/components/customers/AddCustomerModal';
import { ImportModal } from '@/components/customers/ImportModal';
import { ExportModal } from '@/components/customers/ExportModal';
import { EditCustomerModal } from '@/components/customers/EditCustomerModal';
import { supabase } from '@/lib/supabase';
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';

// Interface matching your actual Supabase schema
interface Customer {
  id: number;
  name: string;
  phone: string;
  interest: string;
  floor: number;
  visited_date: string;
  assigned_to?: string;
  notes?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  team_members?: {
    first_name: string;
    last_name: string;
  };
}

export default function CustomersPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [floorFilter, setFloorFilter] = useState('all');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [customerToAssign, setCustomerToAssign] = useState<Customer | null>(null);
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; first_name: string; last_name: string }>>([]);
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [connectionMessage, setConnectionMessage] = useState<string>('');
  const [testingConnection, setTestingConnection] = useState(false);

  // Check if user can delete customers (managers and higher roles)
  const canDeleteCustomers = (() => {
    const role = (user as any)?.user_metadata?.role as string | undefined;
    return !!role && ['business_admin', 'manager'].includes(role);
  })();

  // Test function to check database connection
  const testDatabaseConnection = async () => {
    try {
      const { data: testData, error: testError } = await supabase
        .from('customers')
        .select('count')
        .limit(1);
      
      if (testError) {
        setConnectionStatus('error');
        setConnectionMessage(`Connection failed: ${testError.message}`);
      } else {
        setConnectionStatus('success');
        setConnectionMessage('Database connection successful!');
      }
    } catch (error) {
      setConnectionStatus('error');
      setConnectionMessage('Connection failed: Unexpected error');
    } finally {
      setTestingConnection(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [currentPage, searchTerm, statusFilter, floorFilter]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getAllCustomers();
      
      if (response && response.success && response.data) {
        let filteredCustomers = response.data as Customer[];
        
        // Apply floor filter
        if (floorFilter !== 'all') {
          filteredCustomers = filteredCustomers.filter(customer => 
            customer.floor === parseInt(floorFilter)
          );
        }
        
        setCustomers(filteredCustomers);
      } else {
        setCustomers([]);
      }
    } catch (error) {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async (customerData: any) => {
    try {
      const response = await apiService.createCustomer(customerData);
      if (response.success) {
        // setShowAddModal(false); // This state is no longer needed
        fetchCustomers(); // Refresh the list
      }
    } catch (error: any) {
      console.error('Failed to create customer:', error);
    }
  };

  const handleImportSuccess = () => {
    fetchCustomers(); // Refresh the list after import
  };

  const handleExportSuccess = () => {
    // Export doesn't need to refresh the list
  };

  const getStatusBadgeVariant = (status: string | undefined) => {
    if (!status) return 'outline';
    
    return status.toLowerCase() === 'active' ? 'default' : status.toLowerCase() === 'inactive' ? 'destructive' : 'outline';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowViewModal(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowEditModal(true);
  };

  const handleDeleteCustomer = async (customer: Customer) => {
    if (!canDeleteCustomers) {
      alert('You do not have permission to delete customers.');
      return;
    }

    setCustomerToDelete(customer);
    setDeleteModalOpen(true);
  };

  const confirmDeleteCustomer = async () => {
    if (!customerToDelete) return;

    try {
      await apiService.deleteCustomer(customerToDelete.id);
      fetchCustomers(); // Refresh the list
      setDeleteModalOpen(false);
      setCustomerToDelete(null);
    } catch (error: any) {
      console.error('Failed to delete customer:', error);
    }
  };

  const handleAssignCustomer = async (customer: Customer) => {
    setCustomerToAssign(customer);
    setAssignModalOpen(true);
    try {
      const members = await apiService.getTeamMembers();
      setTeamMembers(
        members.map((m: any) => {
          if (m.first_name && m.last_name) {
            return { id: m.id, first_name: m.first_name, last_name: m.last_name };
          }
          const parts = (m.name || '').trim().split(' ');
          const first = parts.shift() || '';
          const last = parts.join(' ');
          return { id: m.id, first_name: first, last_name: last };
        })
      );
    } catch (e) {
      console.error('Failed to load team members', e);
      setTeamMembers([]);
    }
  };

  const confirmAssign = async () => {
    if (!customerToAssign || !selectedAssignee) return;
    try {
      await apiService.updateCustomer(customerToAssign.id, { assigned_to: selectedAssignee });
      setAssignModalOpen(false);
      setCustomerToAssign(null);
      setSelectedAssignee('');
      fetchCustomers();
    } catch (e) {
      console.error('Failed to assign customer', e);
    }
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Customers</h1>
          <p className="text-text-secondary mt-1">Manage your customer relationships and interactions</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setIsAddCustomerModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2"
            onClick={() => setIsImportModalOpen(true)}
          >
            <Upload className="w-4 h-4" />
            Import
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2"
            onClick={() => setIsExportModalOpen(true)}
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Total Customers</p>
                <p className="text-2xl font-bold text-text-primary">{customers.length || 0}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm font-semibold">👥</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Active Customers</p>
                <p className="text-2xl font-bold text-text-primary">{customers.filter(c => c.status === 'active').length || 0}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm font-semibold">✓</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">New This Month</p>
                <p className="text-2xl font-bold text-text-primary">{
                  customers.filter(c => {
                    const created = new Date(c.created_at);
                    const now = new Date();
                    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                  }).length || 0
                }</p>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 text-sm font-semibold">📈</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Inactive</p>
                <p className="text-2xl font-bold text-text-primary">{customers.filter(c => c.status === 'inactive').length || 0}</p>
              </div>
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 text-sm font-semibold">🎯</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">
                  {floorFilter === 'all' ? 'All Floors' : `Floor ${floorFilter}`}
                </p>
                <p className="text-2xl font-bold text-text-primary">
                  {floorFilter === 'all' 
                    ? customers.length 
                    : customers.filter(c => c.floor === parseInt(floorFilter)).length
                  }
                </p>
              </div>
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-indigo-600 text-sm font-semibold">🏢</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v: 'all'|'active'|'inactive') => setStatusFilter(v)}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={floorFilter} onValueChange={(v: string) => setFloorFilter(v)}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by floor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Floors</SelectItem>
                <SelectItem value="1">Floor 1</SelectItem>
                <SelectItem value="2">Floor 2</SelectItem>
                <SelectItem value="3">Floor 3</SelectItem>
              </SelectContent>
            </Select>
          
            {floorFilter !== 'all' && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setFloorFilter('all')}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
              >
                <span className="text-xs">Clear Floor Filter</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-text-secondary">Loading customers...</div>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-text-secondary mb-2">No customers found</div>
              <div className="text-text-muted text-sm">Start by adding your first customer</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-text-secondary">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-text-secondary">Contact</th>
                    <th className="text-left py-3 px-4 font-medium text-text-secondary">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-text-secondary">Floor Info</th>
                    <th className="text-left py-3 px-4 font-medium text-text-secondary">Assigned To</th>
                    <th className="text-left py-3 px-4 font-medium text-text-secondary">Created</th>
                    <th className="text-left py-3 px-4 font-medium text-text-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-text-primary">{customer.name}</div>
                          <div className="text-xs text-blue-600 font-medium">Floor {customer.floor}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="text-text-primary">{'N/A'}</div>
                          <div className="text-sm text-text-secondary">{customer.phone || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getStatusBadgeVariant(customer.status)}>
                          {customer.status 
                            ? customer.status.charAt(0).toUpperCase() + customer.status.slice(1)
                            : 'Unknown'
                          }
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-text-secondary">
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Floor {customer.floor}
                          </span>
                          {customer.visited_date && (
                            <span className="text-xs text-gray-500">
                              {new Date(customer.visited_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-text-secondary">
                        {customer.team_members 
                          ? `${customer.team_members.first_name} ${customer.team_members.last_name}`
                          : 'Unassigned'}
                      </td>
                      <td className="py-3 px-4 text-text-secondary">
                        {formatDate(customer.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleViewCustomer(customer)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditCustomer(customer)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Customer
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleAssignCustomer(customer)}>
                              <UserPlus className="w-4 h-4 mr-2" />
                              Assign to Team Member
                            </DropdownMenuItem>
                            {canDeleteCustomers && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteCustomer(customer)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Customer
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign Customer Modal */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-text-secondary">Select a team member to assign {customerToAssign?.name}.</p>
            <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.first_name} {m.last_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignModalOpen(false)}>Cancel</Button>
            <Button onClick={confirmAssign} disabled={!selectedAssignee}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Customer Modal */}
      <AddCustomerModal 
        isOpen={isAddCustomerModalOpen}
        onClose={() => setIsAddCustomerModalOpen(false)}
        onSuccess={() => {
          fetchCustomers();
          setIsAddCustomerModalOpen(false);
        }}
      />

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={handleImportSuccess}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onSuccess={handleExportSuccess}
      />

      {/* View Customer Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>
              View customer information and details
            </DialogDescription>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="border rounded-lg p-4">
                <div className="font-semibold mb-4">Basic Information</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Full Name</label>
                    <p className="text-gray-700">{selectedCustomer.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <p className="text-gray-700">{selectedCustomer.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Interest</label>
                    <p className="text-gray-700">{selectedCustomer.interest || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Floor</label>
                    <p className="text-gray-700">Floor {selectedCustomer.floor}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Visited Date</label>
                    <p className="text-gray-700">
                      {selectedCustomer.visited_date ? new Date(selectedCustomer.visited_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <Badge variant={getStatusBadgeVariant(selectedCustomer.status)}>
                      {selectedCustomer.status ? selectedCustomer.status.charAt(0).toUpperCase() + selectedCustomer.status.slice(1) : 'Unknown'}
                    </Badge>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Assigned To</label>
                    <p className="text-gray-700">
                      {selectedCustomer.team_members 
                        ? `${selectedCustomer.team_members.first_name} ${selectedCustomer.team_members.last_name}`
                        : 'Unassigned'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Created</label>
                    <p className="text-gray-700">{formatDate(selectedCustomer.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedCustomer.notes && (
                <div className="border rounded-lg p-4">
                  <div className="font-semibold mb-4">Notes</div>
                  <p className="text-gray-700">{selectedCustomer.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewModal(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setShowViewModal(false);
              handleEditCustomer(selectedCustomer!);
            }}>
              Edit Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Modal */}
      <EditCustomerModal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
        onCustomerUpdated={() => {
          fetchCustomers(); // Refresh the list
          setShowEditModal(false);
          setSelectedCustomer(null);
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setCustomerToDelete(null);
        }}
        onConfirm={confirmDeleteCustomer}
        title="Delete Customer"
        message="Are you sure you want to delete this customer?"
        itemName={customerToDelete ? customerToDelete.name : undefined}
      />
    </div>
  );
}