'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Download, Share2 } from 'lucide-react';
import { getProductImageUrl, getProductEmoji } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  description?: string;
  image_url?: string;
  main_image_url?: string;
  image?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

interface ProductImageModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProductImageModal({ product, open, onOpenChange }: ProductImageModalProps) {
  if (!product) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status?: string) => {
    return status === 'active' ? 'default' : 'secondary';
  };

  const imageUrl = getProductImageUrl(product);
  const productEmoji = getProductEmoji(product);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Product Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Section */}
          <div className="space-y-4">
            <div className="aspect-square bg-muted rounded-lg overflow-hidden">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to emoji if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              
              {/* Fallback emoji when no image or image fails to load */}
              <div className={`w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ${imageUrl ? 'hidden' : ''}`}>
                <span className="text-8xl">
                  {productEmoji}
                </span>
              </div>
            </div>
            
            {/* Image Actions */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download Image
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <Share2 className="w-4 h-4 mr-2" />
                Share Product
              </Button>
            </div>
          </div>

          {/* Product Details Section */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">SKU:</span> {product.sku}</div>
                <div><span className="font-medium">Price:</span> ₹{product.price?.toLocaleString()}</div>
                {product.description && (
                  <div><span className="font-medium">Description:</span> {product.description}</div>
                )}
              </div>
            </div>

            {/* Tags */}
            <div>
              <h4 className="font-medium mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{(product as any).category || (product as any).category_name || 'Jewellery'}</Badge>
                <Badge variant="outline">{(product as any).type || 'Accessory'}</Badge>
                <Badge variant={getStatusColor(product.status)}>
                  {product.status || 'active'}
                </Badge>
              </div>
            </div>

            {/* Product Information */}
            <div>
              <h4 className="font-medium mb-2">Product Information</h4>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Stock Quantity:</span> {(product as any).stock_quantity ?? 'N/A'}</div>
                <div><span className="font-medium">Status:</span> 
                  <Badge variant={getStatusColor(product.status)} className="ml-2">
                    {product.status || 'active'}
                  </Badge>
                </div>
                 <div><span className="font-medium">Created:</span> {formatDate((product as any).created_at)}</div>
                <div><span className="font-medium">Last Updated:</span> {formatDate((product as any).updated_at)}</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button className="flex-1">
                Edit Product
              </Button>
              <Button variant="outline" className="flex-1">
                View History
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
