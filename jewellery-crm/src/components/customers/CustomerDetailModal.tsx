"use client";
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiService, Client } from "@/lib/api-service";
import { useAuth } from "@/hooks/useAuth";
import { Calendar, Phone, Mail, MapPin, User, Clock, Edit, Trash2 } from "lucide-react";
import DeleteConfirmationModal from "@/components/ui/DeleteConfirmationModal";

interface CustomerDetailModalProps {
  open: boolean;
  onClose: () => void;
  customerId: string | null;
  onEdit: (customer: Client) => void;
  onDelete: (customerId: string) => void;
}

interface AuditLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  user: string;
}

export function CustomerDetailModal({ open, onClose, customerId, onEdit, onDelete }: CustomerDetailModalProps) {
  const { user } = useAuth();
  const [customer, setCustomer] = useState<Client | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Check if user can delete customers (managers and higher roles)
  const canDeleteCustomers = user?.role && ['platform_admin', 'business_admin', 'manager'].includes(user.role);

  useEffect(() => {
    if (open && customerId) {
      fetchCustomerDetails();
    }
  }, [open, customerId]);

  const fetchCustomerDetails = async () => {
    if (!customerId) return;
    
    try {
      setLoading(true);
      const response = await apiService.getClient(customerId);
      
      if (response.success && response.data) {
        setCustomer(response.data);
        
        // Fetch real audit logs from the API
        try {
          const auditResponse = await apiService.getClientAuditLogs(customerId);
          if (auditResponse.success && auditResponse.data) {
            const auditData = Array.isArray(auditResponse.data) 
              ? auditResponse.data 
              : auditResponse.data.results || auditResponse.data.data || [];
            
            // Transform audit logs to match our interface
            const transformedLogs = auditData.map((log: any) => ({
              id: log.id.toString(),
              action: log.action === 'create' ? 'Customer Created' :
                      log.action === 'update' ? 'Profile Updated' :
                      log.action === 'delete' ? 'Customer Deleted' :
                      log.action === 'restore' ? 'Customer Restored' : 'Action Performed',
              details: log.action === 'create' ? 'New customer profile created' :
                      log.action === 'update' ? 'Customer information updated' :
                      log.action === 'delete' ? 'Customer marked as deleted' :
                      log.action === 'restore' ? 'Customer restored from trash' : 'Action performed on customer',
              timestamp: log.timestamp,
              user: log.user ? `User ${log.user}` : 'System'
            }));
            setAuditLogs(transformedLogs);
          }
        } catch (auditError) {
          console.error('Error fetching audit logs:', auditError);
          // Fallback to mock data if audit logs fail
          setAuditLogs([
            {
              id: "1",
              action: "Customer Created",
              details: "New customer profile created",
              timestamp: response.data.created_at || new Date().toISOString(),
              user: "System"
            }
          ]);
        }
      }
    } catch (error) {
      console.error('Error fetching customer details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (customer) {
      setDeleteModalOpen(true);
    }
  };

  const confirmDelete = () => {
    if (customer) {
      onDelete(customer.id);
      onClose();
      setDeleteModalOpen(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'customer':
        return 'default';
      case 'lead':
        return 'secondary';
      case 'prospect':
        return 'outline';
      case 'inactive':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>Loading customer information...</DialogDescription>
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

  if (!customer) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>Customer not found</DialogDescription>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-gray-500">Customer information could not be loaded.</p>
          </div>
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
              <DialogTitle>Customer Details</DialogTitle>
              <DialogDescription>
                View and manage customer information
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onEdit(customer)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              {canDeleteCustomers && (
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleDelete}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="interests">Interests</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            {/* Basic Information */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">
                      {customer.first_name} {customer.last_name}
                    </h3>
                    <Badge variant={getStatusBadgeVariant(customer.status || '')} className="capitalize">
                      {customer.status || 'unknown'}
                    </Badge>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  ID: {customer.id}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{customer.email || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{customer.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Date of Birth</p>
                      <p className="font-medium">
                        {customer.date_of_birth ? formatDate(customer.date_of_birth) : 'Not provided'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Anniversary</p>
                      <p className="font-medium">
                        {customer.anniversary_date ? formatDate(customer.anniversary_date) : 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium">
                        {customer.address ? `${customer.address}, ${customer.city || ''}, ${customer.state || ''}` : 'Not provided'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Community</p>
                    <p className="font-medium">{customer.community || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Mother Tongue</p>
                    <p className="font-medium">{customer.mother_tongue || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Catchment Area</p>
                    <p className="font-medium">{customer.catchment_area || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Visit Information */}
            <Card className="p-6">
              <h4 className="font-semibold mb-4">Visit Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Reason for Visit</p>
                  <p className="font-medium">{customer.reason_for_visit || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Lead Source</p>
                  <p className="font-medium">{customer.lead_source || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Age of End User</p>
                  <p className="font-medium">{customer.age_of_end_user || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Saving Scheme</p>
                  <p className="font-medium">{customer.saving_scheme || 'Not specified'}</p>
                </div>
              </div>
            </Card>

            {/* Summary Notes */}
            {customer.summary_notes && (
              <Card className="p-6">
                <h4 className="font-semibold mb-4">Summary Notes</h4>
                <p className="text-gray-700">{customer.summary_notes}</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="interests" className="space-y-6">
            <Card className="p-6">
              <h4 className="font-semibold mb-4">Customer Interests</h4>
              {customer.customer_interests && customer.customer_interests.length > 0 ? (
                <div className="space-y-4">
                  {customer.customer_interests.map((interest, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h5 className="font-medium mb-2">Interest #{index + 1}</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Category</p>
                          <p className="font-medium">{interest.category || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Products</p>
                          <p className="font-medium">
                            {interest.products && interest.products.length > 0 
                              ? interest.products.map(p => p.product).join(', ')
                              : 'No products specified'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No interests recorded</p>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            <Card className="p-6">
              <h4 className="font-semibold mb-4">Audit Log</h4>
              <div className="space-y-4">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Clock className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium">{log.action}</p>
                        <p className="text-sm text-gray-500">{formatDate(log.timestamp)}</p>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{log.details}</p>
                      <p className="text-xs text-gray-400">By: {log.user}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Customer"
        message="Are you sure you want to delete this customer?"
        itemName={customer ? `${customer.first_name} ${customer.last_name}` : undefined}
      />
    </Dialog>
  );
} 