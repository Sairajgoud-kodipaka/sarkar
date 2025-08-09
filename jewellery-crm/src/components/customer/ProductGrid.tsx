'use client';

import React, { useState } from 'react';
import { Heart, ShoppingCart, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getProductImageUrl, getProductEmoji, formatPrice, getDiscountPercentage } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  price: number;
  selling_price?: number;
  discount_price?: number;
  category_name?: string;
  main_image_url?: string;
  image_url?: string;
  image?: string;
}

interface ProductGridProps {
  products: Product[];
}

export default function ProductGrid({ products }: ProductGridProps) {
  const [wishlist, setWishlist] = useState<string[]>([]);

  const toggleWishlist = (productId: string) => {
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const addToCart = (product: Product) => {
    // TODO: Implement cart functionality
    console.log('Adding to cart:', product);
  };

  const viewProduct = (product: Product) => {
    // TODO: Navigate to product detail page
    console.log('Viewing product:', product);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => {
        const isWishlisted = wishlist.includes(product.id);
        const discountPercentage = getDiscountPercentage(product.selling_price || product.price, product.discount_price || 0);
        const displayPrice = product.discount_price || product.selling_price || product.price;
        const imageUrl = getProductImageUrl(product);
        const productEmoji = getProductEmoji(product);

        return (
          <div key={product.id} className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
            {/* Product Image */}
            <div className="relative aspect-square overflow-hidden">
              <img
                src={imageUrl}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                onError={(e) => {
                  // Fallback to emoji if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              
              {/* Fallback emoji when no image or image fails to load */}
              <div className={`w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ${imageUrl ? 'hidden' : ''}`}>
                <span className="text-6xl">
                  {productEmoji}
                </span>
              </div>
              
              {/* Image overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="rounded-full w-10 h-10 p-0"
                    onClick={() => viewProduct(product)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="rounded-full w-10 h-10 p-0"
                    onClick={() => toggleWishlist(product.id)}
                  >
                    <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                </div>
              </div>

              {/* Discount Badge */}
              {discountPercentage > 0 && (
                <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                  -{discountPercentage}%
                </Badge>
              )}
            </div>

            {/* Product Info */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                {product.name}
              </h3>
              
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-900">
                    {formatPrice(displayPrice)}
                  </span>
                  {product.discount_price && product.selling_price && (
                    <span className="text-sm text-gray-500 line-through">
                      {formatPrice(product.selling_price)}
                    </span>
                  )}
                </div>
              </div>

              <Button 
                className="w-full" 
                onClick={() => addToCart(product)}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add to Cart
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
} 