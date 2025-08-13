'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Download, X, FileText, AlertCircle, Eye } from 'lucide-react';
import { apiService } from '@/lib/api-service';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedCustomer {
  name: string;
  phone: string;
  interest: string;
  floor: number;
  visited_date: string;
  status: string;
  notes?: string;
  assigned_to?: string; // Add missing assigned_to field
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  date_of_birth?: string;
  anniversary_date?: string;
  preferred_metal?: string;
  preferred_stone?: string;
  budget_range?: string;
  customer_type?: string;
  lead_source?: string;
  community?: string;
  mother_tongue?: string;
  reason_for_visit?: string;
  age_of_end_user?: string;
  saving_scheme?: string;
  catchment_area?: string;
  next_follow_up?: string;
  summary_notes?: string;
  ring_size?: string;
  customer_interests?: string;
}

export function ImportModal({ isOpen, onClose, onSuccess }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedCustomer[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const downloadTemplate = () => {
    const headers = [
      'name',
      'phone',
      'interest',
      'floor',
      'visited_date',
      'status',
      'notes',
      'assigned_to', // Add missing assigned_to field
      'email',
      'address',
      'city',
      'state',
      'country',
      'postal_code',
      'date_of_birth',
      'anniversary_date',
      'community',
      'mother_tongue',
      'reason_for_visit',
      'age_of_end_user',
      'saving_scheme',
      'catchment_area',
      'next_follow_up',
      'summary_notes',
      'ring_size',
      'customer_interests'
    ];

    const csvContent = headers.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customers_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const parseCSV = (file: File): Promise<ParsedCustomer[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csv = e.target?.result as string;
          const lines = csv.split('\n').filter(line => line.trim());
          const headers = lines[0].split(',').map(h => h.trim());
          
          const data: ParsedCustomer[] = [];
          const errors: string[] = [];
          
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            const values = line.split(',').map(v => v.trim());
            
            if (values.length < headers.length) {
              errors.push(`Line ${i + 1}: Insufficient columns`);
              continue;
            }
            
            const row: any = {};
            headers.forEach((header, index) => {
              let value = values[index] || '';
              // Remove quotes if present
              if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
              }
              row[header] = value;
            });
            
            // Validate required fields
            if (!row.name || !row.phone || !row.floor) {
              errors.push(`Line ${i + 1}: Missing required fields (name, phone, floor)`);
              continue;
            }
            
            // Validate floor number
            const floor = parseInt(row.floor);
            if (isNaN(floor) || floor < 1 || floor > 10) {
              errors.push(`Line ${i + 1}: Invalid floor number (must be 1-10)`);
              continue;
            }
            
            // Validate status
            if (row.status && !['active', 'inactive', 'lead', 'prospect', 'customer', 'vip'].includes(row.status.toLowerCase())) {
              errors.push(`Line ${i + 1}: Invalid status (must be active, inactive, lead, prospect, customer, or vip)`);
              continue;
            }
            
            // Parse dates
            if (row.visited_date) {
              const date = new Date(row.visited_date);
              if (isNaN(date.getTime())) {
                errors.push(`Line ${i + 1}: Invalid visited_date format (use YYYY-MM-DD)`);
                continue;
              }
              row.visited_date = date.toISOString().split('T')[0];
            }
            
            if (row.date_of_birth) {
              const date = new Date(row.date_of_birth);
              if (isNaN(date.getTime())) {
                errors.push(`Line ${i + 1}: Invalid date_of_birth format (use YYYY-MM-DD)`);
                continue;
              }
              row.date_of_birth = date.toISOString().split('T')[0];
            }
            
            if (row.anniversary_date) {
              const date = new Date(row.anniversary_date);
              if (isNaN(date.getTime())) {
                errors.push(`Line ${i + 1}: Invalid anniversary_date format (use YYYY-MM-DD)`);
                continue;
              }
              row.anniversary_date = date.toISOString().split('T')[0];
            }
            
            if (row.next_follow_up) {
              const date = new Date(row.next_follow_up);
              if (isNaN(date.getTime())) {
                errors.push(`Line ${i + 1}: Invalid next_follow_up format (use YYYY-MM-DD)`);
                continue;
              }
              row.next_follow_up = date.toISOString().split('T')[0];
            }
            
            data.push(row as ParsedCustomer);
          }
          
          if (errors.length > 0) {
            setValidationErrors(errors);
            reject(new Error(`Validation failed: ${errors.length} errors found`));
            return;
          }
          
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setError(null);
        setValidationErrors([]);
        setParsedData([]);
        
        try {
          const data = await parseCSV(selectedFile);
          setParsedData(data);
        } catch (error: any) {
          setError(error.message);
        }
      } else {
        setError('Please select a valid CSV file');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file || parsedData.length === 0) {
      setError('Please select a valid file to upload');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const response = await apiService.importCustomers(parsedData);
      
      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
          setSuccess(false);
          setFile(null);
          setParsedData([]);
          setValidationErrors([]);
        }, 2000);
      } else {
        setError(response.message || 'Failed to import customers');
      }
    } catch (error) {
      console.error('Import error:', error);
      setError('Failed to import customers. Please check your file format.');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text-primary">Import Customers</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {success ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-green-600 text-xl">✓</span>
            </div>
            <h3 className="text-lg font-medium text-text-primary mb-2">Import Successful!</h3>
            <p className="text-text-secondary">Your customers have been imported successfully.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <Label htmlFor="file" className="text-sm font-medium text-text-primary">
                  Upload CSV File
                </Label>
                <div className="mt-2">
                  <Input
                    id="file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                </div>
                {file && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-text-secondary">
                    <FileText className="w-4 h-4" />
                    {file.name}
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-600">{error}</span>
                </div>
              )}

              {validationErrors.length > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <h4 className="font-medium text-yellow-800 mb-2">Validation Errors ({validationErrors.length})</h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {validationErrors.map((error, index) => (
                      <div key={index} className="text-sm text-yellow-700">• {error}</div>
                    ))}
                  </div>
                </div>
              )}

              {parsedData.length > 0 && (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-text-primary">Data Preview ({parsedData.length} customers)</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {showPreview ? 'Hide' : 'Show'} Preview
                    </Button>
                  </div>
                  
                  {showPreview && (
                    <div className="max-h-48 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left p-2">Name</th>
                            <th className="text-left p-2">Phone</th>
                            <th className="text-left p-2">Floor</th>
                            <th className="text-left p-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedData.slice(0, 10).map((customer, index) => (
                            <tr key={index} className="border-b">
                              <td className="p-2">{customer.name}</td>
                              <td className="p-2">{customer.phone}</td>
                              <td className="p-2">{customer.floor}</td>
                              <td className="p-2">{customer.status || 'active'}</td>
                            </tr>
                          ))}
                          {parsedData.length > 10 && (
                            <tr>
                              <td colSpan={4} className="p-2 text-center text-gray-500">
                                ... and {parsedData.length - 10} more customers
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              <div className="border-t pt-4">
                <Button
                  variant="outline"
                  onClick={downloadTemplate}
                  className="w-full flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Template
                </Button>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!file || parsedData.length === 0 || uploading || validationErrors.length > 0}
                className="flex-1 flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Importing {parsedData.length} customers...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Import {parsedData.length} Customers
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 