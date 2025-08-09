'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Package, 
  Plus, 
  Search,
  Filter,
  Star,
  Eye,
  ShoppingCart
} from 'lucide-react';
import { getProductImageUrl, getProductEmoji, formatPrice } from '@/lib/utils';
import { apiService } from '@/lib/api-service';
import { toast } from 'sonner';

interface Product {
  id: number;
  name: string;
  sku: string;
  type: string;
  category: string;
  price: number;
  stock_quantity: number;
  description?: string;
  image?: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export default function SalesProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getProducts({
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        type: selectedType === 'all' ? undefined : selectedType,
        search: searchTerm || undefined,
        status: 'active'
      });
      
      if (response.success) {
        setProducts(response.data);
      } else {
        setError('Failed to load products');
        toast.error('Failed to load products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products');
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Refetch when filters change
  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedType, searchTerm]);

  // OLD MOCK DATA - REPLACED WITH REAL API
  /*
  const mockProducts: Product[] = [
        {
          id: 1,
          name: 'Gold Necklace Set',
          sku: 'GN-001',
          type: 'Necklace',
          category: 'Gold',
          price: 75000,
          stock_quantity: 5,
          description: 'Beautiful gold necklace set with matching earrings',
          image_url: '',
          status: 'active',
          created_at: '2024-01-01'
        },
        {
          id: 2,
          name: 'Diamond Ring',
          sku: 'DR-002',
          type: 'Ring',
          category: 'Diamond',
          price: 120000,
          stock_quantity: 3,
          description: 'Elegant diamond ring with platinum band',
          image_url: '',
          status: 'active',
          created_at: '2024-01-05'
        },
        {
          id: 3,
          name: 'Silver Bracelet',
          sku: 'SB-003',
          type: 'Bracelet',
          category: 'Silver',
          price: 25000,
          stock_quantity: 8,
          description: 'Delicate silver bracelet with intricate design',
          image_url: '',
          status: 'active',
          created_at: '2024-01-10'
        }
  ];
  */

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesType = selectedType === 'all' || product.type === selectedType;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  const categories = ['Gold', 'Silver', 'Diamond', 'Platinum', 'Pearl'];
  const types = ['Necklace', 'Ring', 'Bracelet', 'Earring', 'Chain'];

  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.status === 'active').length;
  const lowStockProducts = products.filter(p => p.stock_quantity <= 3).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchProducts}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">Browse and manage your product catalog</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-blue-600">{totalProducts}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Products</p>
                <p className="text-2xl font-bold text-green-600">{activeProducts}</p>
              </div>
              <Star className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-orange-600">{lowStockProducts}</p>
        </div>
              <ShoppingCart className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input 
                  placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
              />
            </div>
            </div>
            <div className="flex gap-2">
            <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
            </select>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                {types.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
            </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Product Catalog</CardTitle>
          <CardDescription>
            {filteredProducts.length} products found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No products found</p>
                <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                      {getProductEmoji(product)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-500">{product.sku}</p>
          </div>
        </div>
        
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium">{product.category}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium">{product.type}</span>
                          </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Stock:</span>
                      <span className={`font-medium ${product.stock_quantity <= 3 ? 'text-orange-600' : 'text-green-600'}`}>
                        {product.stock_quantity} units
                      </span>
                      </div>
                        </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-gray-900">{formatPrice(product.price)}</p>
                      <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                        {product.status}
                      </Badge>
                    </div>
                      <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      <Button size="sm">
                          <ShoppingCart className="w-4 h-4" />
                        </Button>
                      </div>
              </div>
            </div>
              ))}
              
              {filteredProducts.length === 0 && !loading && (
                <div className="col-span-full text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                  <p className="text-gray-600">Try adjusting your filters or add a new product</p>
        </div>
      )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}