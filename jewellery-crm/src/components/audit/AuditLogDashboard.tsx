'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Download, Filter, Search, Eye, User, Database, Activity, X } from 'lucide-react';
import { apiService } from '@/lib/api-service';
import { AuditLog, AuditLogFilters } from '@/types';
import { useAuth } from '@/hooks/useAuth';

interface AuditLogDashboardProps {
  className?: string;
}

interface AuditDetailsModalProps {
  log: AuditLog | null;
  isOpen: boolean;
  onClose: () => void;
}

// Component for the View Details Modal
function AuditDetailsModal({ log, isOpen, onClose }: AuditDetailsModalProps) {
  if (!isOpen || !log) return null;

  const formatJsonData = (data: any) => {
    if (!data) return null;
    
    const formattedData: Record<string, any> = {};
    
    // Filter out internal fields and format the data
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'id' || key === 'created_at' || key === 'updated_at') return;
      
      if (value === null) {
        formattedData[key] = 'Not set';
      } else if (typeof value === 'string' && value.includes('T')) {
        // Format dates
        try {
          formattedData[key] = new Date(value).toLocaleString('en-IN');
        } catch {
          formattedData[key] = value;
        }
      } else if (typeof value === 'boolean') {
        formattedData[key] = value ? 'Yes' : 'No';
      } else if (typeof value === 'object' && value !== null) {
        formattedData[key] = JSON.stringify(value, null, 2);
      } else {
        formattedData[key] = value;
      }
    });
    
    return formattedData;
  };

  const oldValues = formatJsonData(log.old_values);
  const newValues = formatJsonData(log.new_values);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return 'bg-green-100 text-green-800';
      case 'update': return 'bg-blue-100 text-blue-800';
      case 'delete': return 'bg-red-100 text-red-800';
      case 'restore': return 'bg-yellow-100 text-yellow-800';
      case 'login': return 'bg-purple-100 text-purple-800';
      case 'logout': return 'bg-gray-100 text-gray-800';
      case 'export': return 'bg-indigo-100 text-indigo-800';
      case 'import': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">Audit Log Details</h2>
            <p className="text-sm text-muted-foreground">
              {log.table_name} - {log.action.toUpperCase()} - Record ID: {log.record_id}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid gap-6">
            {/* Basic Information */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-sm font-medium">Action</Label>
                <div className="mt-1">
                  <Badge className={getActionColor(log.action)}>
                    {log.action.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Table</Label>
                <div className="mt-1 text-sm">{log.table_name}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Record ID</Label>
                <div className="mt-1 text-sm">{log.record_id}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Timestamp</Label>
                <div className="mt-1 text-sm">
                  {new Date(log.created_at).toLocaleString('en-IN')}
                </div>
              </div>
              {log.user_email && (
                <div>
                  <Label className="text-sm font-medium">User</Label>
                  <div className="mt-1 text-sm">{log.user_email}</div>
                </div>
              )}
              {log.ip_address && (
                <div>
                  <Label className="text-sm font-medium">IP Address</Label>
                  <div className="mt-1 text-sm font-mono text-xs">{log.ip_address}</div>
                </div>
              )}
            </div>

            {/* Data Changes */}
            <div className="grid gap-4">
              {oldValues && Object.keys(oldValues).length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-red-600">Previous Values</Label>
                  <div className="mt-2 space-y-2">
                    {Object.entries(oldValues).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-start p-2 bg-red-50 rounded border">
                        <span className="text-sm font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="text-sm text-gray-700 max-w-xs text-right break-words">
                          {String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {newValues && Object.keys(newValues).length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-green-600">New Values</Label>
                  <div className="mt-2 space-y-2">
                    {Object.entries(newValues).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-start p-2 bg-green-50 rounded border">
                        <span className="text-sm font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="text-sm text-gray-700 max-w-xs text-right break-words">
                          {String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Additional Context */}
            {log.additional_context && (
              <div>
                <Label className="text-sm font-medium">Additional Context</Label>
                <div className="mt-2 p-3 bg-gray-50 rounded border">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(log.additional_context, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuditLogDashboard({ className }: AuditLogDashboardProps) {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [filters, setFilters] = useState<AuditLogFilters>({
    limit: 50,
    offset: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTable, setSelectedTable] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchAuditLogs();
    fetchSummary();
  }, [filters]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAuditLogs(filters);
      if (response.success && response.data) {
        setAuditLogs(response.data);
      }
    } catch (error) {
      // console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await apiService.getAuditSummary(dateFrom, dateTo);
      if (response.success && response.data) {
        setSummary(response.data);
      }
    } catch (error) {
      // console.error('Error fetching summary:', error);
    }
  };

  const handleFilterChange = (key: keyof AuditLogFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, offset: 0 }));
  };

  const handleSearch = () => {
    const newFilters: AuditLogFilters = {
      ...filters,
      table_name: selectedTable === 'all' ? undefined : selectedTable || undefined,
      action: selectedAction === 'all' ? undefined : selectedAction || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      offset: 0
    };
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({ limit: 50, offset: 0 });
    setSearchTerm('');
    setSelectedTable('all');
    setSelectedAction('all');
    setDateFrom('');
    setDateTo('');
  };

  const exportAuditLogs = async (format: 'csv' | 'excel') => {
    try {
      const response = await apiService.exportAuditLogs(filters, format);
      if (response.success) {
        // TODO: Implement actual file download
      }
    } catch (error) {
      // console.error('Error exporting audit logs:', error);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return 'bg-green-100 text-green-800';
      case 'update': return 'bg-blue-100 text-blue-800';
      case 'delete': return 'bg-red-100 text-red-800';
      case 'restore': return 'bg-yellow-100 text-yellow-800';
      case 'login': return 'bg-purple-100 text-purple-800';
      case 'logout': return 'bg-gray-100 text-gray-800';
      case 'export': return 'bg-indigo-100 text-indigo-800';
      case 'import': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatJsonData = (data: any, maxFields: number = 3) => {
    if (!data) return null;
    
    const entries = Object.entries(data);
    const displayEntries = entries.slice(0, maxFields);
    const remainingCount = entries.length - maxFields;
    
    const formatted = displayEntries.map(([key, value]) => {
      let displayValue = value;
      if (value === null) displayValue = 'Not set';
      else if (typeof value === 'string' && value.length > 20) {
        displayValue = value.substring(0, 20) + '...';
      }
      return `${key.replace(/_/g, ' ')}: ${displayValue}`;
    }).join(', ');
    
    if (remainingCount > 0) {
      return `${formatted} +${remainingCount} more fields`;
    }
    
    return formatted;
  };

  const openDetailsModal = (log: AuditLog) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setIsModalOpen(false);
    setSelectedLog(null);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Log Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and track all system activities and changes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportAuditLogs('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => exportAuditLogs('excel')}>
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Actions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_actions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(summary.actions_by_user).length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tables Monitored</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(summary.actions_by_table).length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Actions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.recent_activity.filter((log: any) => 
                  new Date(log.created_at).toDateString() === new Date().toDateString()
                ).length}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="table">Table</Label>
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger>
                  <SelectValue placeholder="All Tables" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tables</SelectItem>
                  <SelectItem value="customers">Customers</SelectItem>
                  <SelectItem value="products">Products</SelectItem>
                  <SelectItem value="orders">Orders</SelectItem>
                  <SelectItem value="appointments">Appointments</SelectItem>
                  <SelectItem value="users">Users</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="action">Action</Label>
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="restore">Restore</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                  <SelectItem value="export">Export</SelectItem>
                  <SelectItem value="import">Import</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateFrom">Date From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo">Date To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
          <CardDescription>
            Showing {auditLogs.length} recent audit log entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading audit logs...</div>
            ) : auditLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No audit logs found matching the current filters.
              </div>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div key={log.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className={getActionColor(log.action)}>
                          {log.action.toUpperCase()}
                        </Badge>
                        <span className="font-medium">{log.table_name}</span>
                        {log.record_id > 0 && (
                          <span className="text-sm text-muted-foreground">
                            Record ID: {log.record_id}
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatTimestamp(log.created_at)}
                      </span>
                    </div>
                    
                    <div className="grid gap-3 md:grid-cols-2">
                      {log.old_values && (
                        <div>
                          <Label className="text-sm font-medium text-red-600">Previous Values</Label>
                          <div className="text-sm bg-red-50 p-3 rounded border">
                            <div className="text-gray-700">
                              {formatJsonData(log.old_values)}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {log.new_values && (
                        <div>
                          <Label className="text-sm font-medium text-green-600">New Values</Label>
                          <div className="text-sm bg-green-50 p-3 rounded border">
                            <div className="text-gray-700">
                              {formatJsonData(log.new_values)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        {log.user_email && (
                          <span>User: {log.user_email}</span>
                        )}
                        {log.ip_address && (
                          <span>IP: {log.ip_address}</span>
                        )}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openDetailsModal(log)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {auditLogs.length > 0 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Showing {(filters.offset || 0) + 1} to {(filters.offset || 0) + auditLogs.length} of results
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(filters.offset || 0) === 0}
                  onClick={() => handleFilterChange('offset', Math.max(0, (filters.offset || 0) - (filters.limit || 50)))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={auditLogs.length < (filters.limit || 50)}
                  onClick={() => handleFilterChange('offset', (filters.offset || 0) + (filters.limit || 50))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Details Modal */}
      <AuditDetailsModal 
        log={selectedLog}
        isOpen={isModalOpen}
        onClose={closeDetailsModal}
      />
    </div>
  );
}
