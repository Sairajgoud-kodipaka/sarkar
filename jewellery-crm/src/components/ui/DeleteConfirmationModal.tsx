import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, X } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemName?: string;
  loading?: boolean;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  loading = false
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            disabled={loading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="h-8 w-8 text-red-600" />
          </div>
          <p className="text-gray-600 mb-2">{message}</p>
          {itemName && (
            <p className="font-medium text-gray-900">"{itemName}"</p>
          )}
          <p className="text-sm text-gray-500 mt-2">This action cannot be undone.</p>
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
