'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Download, X, FileText, AlertCircle } from 'lucide-react';
import { apiService } from '@/lib/api-service';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportModal({ isOpen, onClose, onSuccess }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const downloadTemplate = () => {
    const headers = [
      'first_name',
      'last_name',
      'email',
      'phone',
      'status',
      'lead_source',
      'preferred_metal',
      'budget_range',
      'customer_type',
      'address',
      'city',
      'state',
      'country',
      'postal_code',
      'date_of_birth',
      'anniversary_date',
      'preferred_stone',
      'ring_size',
      'notes',
      'community',
      'mother_tongue',
      'reason_for_visit',
      'age_of_end_user',
      'saving_scheme',
      'catchment_area',
      'next_follow_up',
      'summary_notes',
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please select a valid CSV file');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await apiService.importCustomers(formData);
      
      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
          setSuccess(false);
          setFile(null);
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
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
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
                disabled={!file || uploading}
                className="flex-1 flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Import Customers
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