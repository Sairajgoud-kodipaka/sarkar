'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Filter, MoreHorizontal, Package, Tag, TrendingUp, Eye, Edit, Trash2, X, Store, Globe } from 'lucide-react';
import { apiService } from '@/lib/api-service';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AddProductModal from '@/components/products/AddProductModal';
import CategoriesModal from '@/components/products/CategoriesModal';
import ImportModal from '@/components/products/ImportModal';
import ProductActionsModal from '@/components/products/ProductActionsModal';
import ScopeIndicator from '@/components/ui/ScopeIndicator';
import { useScopedVisibility } from '@/lib/scoped-visibility';
import { getProductImageUrl, getProductEmoji } from '@/lib/utils';

interface Product {
  id: number;
  name: string;
  sku: string;
  type: string;
  category: string;
  price: number;
  image_url?: string;
  description?: string;
  stock_quantity?: number;
  status?: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
  // Additional properties for floor manager view
  cost_price?: number;
  selling_price?: number;
  discount_price?: number;
  quantity?: number;
  min_quantity?: number;
  max_quantity?: number;
  weight?: number;
  dimensions?: string;
  material?: string;
  color?: string;
  size?: string;
  is_featured?: boolean;
  brand?: string;
  supplier?: string;
  barcode?: string;
  location?: string;
  notes?: string;
  tax_rate?: number;
  warranty_period?: string;
  return_policy?: string;
  care_instructions?: string;
  certifications?: string[];
  tags?: string[];
  images?: string[];
  variants?: any[];
  reviews?: any[];
  rating?: number;
  popularity_score?: number;
  last_sold?: string;
  last_restocked?: string;
  store_name?: string;
  store_location?: string;
}

interface Category {
  id: number;
  name: string;
  description?: string;
  product_count: number;
  scope: 'global' | 'store';
}

export default function FloorManagerProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'global' | 'store'>('all');
  const [storeFilter, setStoreFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isActionsModalOpen, setIsActionsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedAction, setSelectedAction] = useState<'view' | 'edit' | 'delete' | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [globalCatalogue, setGlobalCatalogue] = useState<any>(null);
  const [showGlobalCatalogue, setShowGlobalCatalogue] = useState(false);
  
  // Get user scope for scoped visibility (floor managers have floor-specific scope)
  const { userScope, canAccessAllData, canAccessStoreData } = useScopedVisibility();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [currentPage, searchTerm, categoryFilter, scopeFilter, storeFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Floor managers can access floor-specific products
      const response = await apiService.getProducts({
        page: currentPage,
        search: searchTerm || undefined,
        category: categoryFilter === 'all' ? undefined : categoryFilter,
      });

      if (response.success && response.data) {
        // Handle paginated response
        let productsData: Product[] = [];
        if (Array.isArray(response.data)) {
          productsData = response.data;
        } else if (typeof response.data === 'object' && response.data !== null) {
          const data = response.data as any;
          if (data.results && Array.isArray(data.results)) {
            productsData = data.results;
          } else if (data.data && Array.isArray(data.data)) {
            productsData = data.data;
          }
        }
        
        // Apply store filter if needed
        if (storeFilter !== 'all') {
          productsData = productsData.filter(product => 
            product.store_name === storeFilter
          );
        }
        
        setProducts(productsData);
        console.log(`Loaded ${productsData.length} products`);
      } else {
        console.warn('Products response is not valid:', response.data);
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiService.getCategories({
        scope: scopeFilter === 'all' ? undefined : scopeFilter
      });
      
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  const handleAddProduct = () => {
    setIsAddModalOpen(true);
  };

  const handleProductAction = (product: Product, action: 'view' | 'edit' | 'delete') => {
    setSelectedProduct(product);
    setSelectedAction(action);
    setIsActionsModalOpen(true);
  };

  const handleProductUpdated = () => {
    fetchProducts();
    setIsActionsModalOpen(false);
    setSelectedProduct(null);
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImageModalOpen(true);
  };

  const handleViewGlobalCatalogue = async () => {
    try {
      const response = await apiService.getGlobalCatalogue();
      if (response.success) {
        setGlobalCatalogue(response.data);
        setShowGlobalCatalogue(true);
      }
    } catch (error) {
      console.error('Error fetching global catalogue:', error);
    }
  };

  // Calculate statistics
  const stats = {
    total: products.length,
    active: products.filter(p => p.status === 'active').length,
    lowStock: products.filter(p => (p.stock_quantity || 0) <= 5).length,
    outOfStock: products.filter(p => (p.stock_quantity || 0) === 0).length,
    totalValue: products.reduce((sum, p) => sum + (p.price * (p.stock_quantity || 0)), 0),
    avgPrice: products.length > 0 ? products.reduce((sum, p) => sum + p.price, 0) / products.length : 0
  };

  const getStatusBadge = (status: string) => {
    const config = {
      active: { color: 'bg-green-100 text-green-800', text: 'Active' },
      inactive: { color: 'bg-gray-100 text-gray-800', text: 'Inactive' }
    };
    const { color, text } = config[status as keyof typeof config] || config.active;
    return <Badge className={color}>{text}</Badge>;
  };

  const getStockStatusBadge = (quantity: number) => {
    if (quantity === 0) {
      return <Badge className="bg-red-100 text-red-800">Out of Stock</Badge>;
    } else if (quantity <= 5) {
      return <Badge className="bg-yellow-100 text-yellow-800">Low Stock</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800">In Stock</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products Management</h1>
          <p className="text-gray-600">Manage your floor's product inventory</p>
        </div>
        <div className="flex space-x-2">
          <ScopeIndicator />
          <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
            <Package className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" onClick={handleViewGlobalCatalogue}>
            <Globe className="w-4 h-4 mr-2" />
            Global Catalogue
          </Button>
          <Button onClick={handleAddProduct}>
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.lowStock}</p>
              </div>
              <Tag className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
              </div>
              <X className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-blue-600">₹{stats.totalValue.toLocaleString()}</p>
              </div>
              <Store className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Price</p>
                <p className="text-2xl font-bold text-purple-600">₹{Math.round(stats.avgPrice).toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                  placeholder="Search products by name, SKU, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              </div>
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name} ({category.product_count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setIsCategoriesModalOpen(true)}
              className="whitespace-nowrap"
            >
              <Filter className="w-4 h-4 mr-2" />
              Manage Categories
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-square relative bg-gray-100">
              {product.image_url ? (
                <img
                  src={getProductImageUrl(product.image_url)}
                  alt={product.name}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => handleImageClick(getProductImageUrl(product.image_url!))}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">
                  {getProductEmoji(product.category)}
                </div>
              )}
              <div className="absolute top-2 right-2">
                {getStatusBadge(product.status || 'active')}
              </div>
              <div className="absolute top-2 left-2">
                {getStockStatusBadge(product.stock_quantity || 0)}
              </div>
              </div>

            <CardContent className="p-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg text-gray-900 truncate" title={product.name}>
                  {product.name}
                </h3>
                <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                <div className="flex justify-between items-center">
                  <Badge variant="outline">{product.category}</Badge>
                  <Badge variant="outline">{product.type}</Badge>
              </div>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-blue-600">₹{product.price.toLocaleString()}</span>
                  <span className="text-sm text-gray-600">Stock: {product.stock_quantity || 0}</span>
              </div>
              {product.description && (
                  <p className="text-sm text-gray-600 line-clamp-2" title={product.description}>
                  {product.description}
                </p>
              )}
              </div>
              
              <div className="flex justify-between mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleProductAction(product, 'view')}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleProductAction(product, 'edit')}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleProductAction(product, 'view')}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleProductAction(product, 'edit')}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Product
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleProductAction(product, 'delete')}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Product
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {products.length === 0 && !loading && (
        <Card className="p-8 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || categoryFilter !== 'all'
              ? 'Try adjusting your search criteria'
              : 'Start by adding your first product to the inventory'}
          </p>
          <Button onClick={handleAddProduct}>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </Card>
      )}

      {/* Modals */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchProducts}
      />

      <CategoriesModal
        isOpen={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
        onSuccess={fetchCategories}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={fetchProducts}
      />

      <ProductActionsModal
        isOpen={isActionsModalOpen}
        onClose={() => setIsActionsModalOpen(false)}
        product={selectedProduct}
        action={selectedAction}
        onSuccess={handleProductUpdated}
      />

      {/* Image Modal */}
      {imageModalOpen && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative max-w-4xl max-h-4xl p-4">
            <Button
              variant="outline"
              size="icon"
              className="absolute top-2 right-2 bg-white"
              onClick={() => setImageModalOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
            <img
              src={selectedImage}
              alt="Product"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* Global Catalogue Modal */}
      {showGlobalCatalogue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-96 overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Global Product Catalogue</h2>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowGlobalCatalogue(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Total Products:</span>
                  <span className="ml-2">{globalCatalogue?.total_products || 0}</span>
                </div>
                <div>
                  <span className="font-medium">Total Stores:</span>
                  <span className="ml-2">{globalCatalogue?.total_stores || 0}</span>
                </div>
                <div>
                  <span className="font-medium">Categories:</span>
                  <span className="ml-2">{categories.length}</span>
                </div>
              </div>
              <p className="text-gray-600">
                Global catalogue data and analytics would be displayed here.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}