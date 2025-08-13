'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, X, AlertCircle } from 'lucide-react';
import { apiService } from '@/lib/api-service';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ExportModal({ isOpen, onClose, onSuccess }: ExportModalProps) {
  const [format, setFormat] = useState('csv');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'name',
    'sku',
    'category',
    'price',
    'quantity',
    'status'
  ]);

  const availableFields = [
    { key: 'name', label: 'Product Name' },
    { key: 'sku', label: 'SKU' },
    { key: 'type', label: 'Type' },
    { key: 'category', label: 'Category' },
    { key: 'price', label: 'Price' },
    { key: 'cost_price', label: 'Cost Price' },
    { key: 'selling_price', label: 'Selling Price' },
    { key: 'discount_price', label: 'Discount Price' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'min_quantity', label: 'Min Quantity' },
    { key: 'max_quantity', label: 'Max Quantity' },
    { key: 'status', label: 'Status' },
    { key: 'description', label: 'Description' },
    { key: 'image_url', label: 'Image URL' },
    { key: 'main_image', label: 'Main Image' },
    { key: 'weight', label: 'Weight' },
    { key: 'dimensions', label: 'Dimensions' },
    { key: 'material', label: 'Material' },
    { key: 'color', label: 'Color' },
    { key: 'size', label: 'Size' },
    { key: 'is_featured', label: 'Is Featured' },
    { key: 'is_bestseller', label: 'Is Bestseller' },
    { key: 'store', label: 'Store ID' },
    { key: 'store_name', label: 'Store Name' },
    { key: 'scope', label: 'Scope' },
    { key: 'is_in_stock', label: 'In Stock' },
    { key: 'is_low_stock', label: 'Low Stock' },
    { key: 'current_price', label: 'Current Price' },
    { key: 'profit_margin', label: 'Profit Margin' },
    { key: 'variant_count', label: 'Variant Count' },
    { key: 'created_at', label: 'Created Date' },
    { key: 'updated_at', label: 'Updated Date' }
  ];

  const handleFieldToggle = (fieldKey: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldKey)
        ? prev.filter(f => f !== fieldKey)
        : [...prev, fieldKey]
    );
  };

  const handleSelectAll = () => {
    setSelectedFields(availableFields.map(f => f.key));
  };

  const handleDeselectAll = () => {
    setSelectedFields([]);
  };

  const handleExport = async () => {
    if (selectedFields.length === 0) {
      setError('Please select at least one field to export');
      return;
    }

    try {
      setExporting(true);
      setError(null);

      const response = await apiService.exportProducts({
        format,
        fields: selectedFields
      });
      
      if (response.success && response.data instanceof Blob) {
        const url = window.URL.createObjectURL(response.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `products_export.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        onSuccess();
        onClose();
      } else {
        setError('Invalid file data received from server');
      }
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export products. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text-primary">Export Products</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* Format Selection */}
          <div>
            <Label className="text-sm font-medium text-text-primary">Export Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Fields Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium text-text-primary">Select Fields</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-xs"
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeselectAll}
                  className="text-xs"
                >
                  Deselect All
                </Button>
              </div>
            </div>
            
            <div className="border rounded-md p-3 max-h-60 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                {availableFields.map((field) => (
                  <div key={field.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={field.key}
                      checked={selectedFields.includes(field.key)}
                      onCheckedChange={() => handleFieldToggle(field.key)}
                    />
                    <Label
                      htmlFor={field.key}
                      className="text-sm text-text-secondary cursor-pointer"
                    >
                      {field.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={exporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={selectedFields.length === 0 || exporting}
              className="flex-1 flex items-center gap-2"
            >
              {exporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export Products
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
