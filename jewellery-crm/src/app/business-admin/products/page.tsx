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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DataTable, Column } from '@/components/tables/DataTable';

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
  // Additional properties for business admin view
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
  is_bestseller?: boolean;
  main_image?: string;
  main_image_url?: string;
  additional_images?: string[];
  additional_images_urls?: string[];
  store?: number;
  store_name?: string;
  scope?: 'global' | 'store';
  is_in_stock?: boolean;
  is_low_stock?: boolean;
  current_price?: number;
  profit_margin?: number;
  variant_count?: number;
}

interface Category {
  id: number;
  name: string;
  description?: string;
  product_count?: number;
  store?: number;
  store_name?: string;
  scope: 'global' | 'store';
}

export default function ProductsPage() {
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
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  
  // Get user scope for scoped visibility
  const { userScope, canAccessAllData, canAccessStoreData } = useScopedVisibility();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [currentPage, searchTerm, categoryFilter, scopeFilter, storeFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Use scoped endpoint based on user role
      let response;
      if (userScope.type === 'own') {
        // For salespeople, use the "my" endpoint
        response = await apiService.getMyProducts({
          page: currentPage,
          search: searchTerm || undefined,
          category: categoryFilter === 'all' ? undefined : categoryFilter,
        });
      } else {
        // For business admin and managers, use the regular endpoint
        response = await apiService.getProducts({
          page: currentPage,
          search: searchTerm || undefined,
          category: categoryFilter === 'all' ? undefined : categoryFilter,
        });
      }

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
        scope: scopeFilter === 'all' ? undefined : scopeFilter,
      });
      
      if (response.success && response.data) {
        let categoriesData: Category[] = [];
        if (Array.isArray(response.data)) {
          categoriesData = response.data;
        } else if (typeof response.data === 'object' && response.data !== null) {
        const data = response.data as any;
          if (data.results && Array.isArray(data.results)) {
            categoriesData = data.results;
          } else if (data.data && Array.isArray(data.data)) {
            categoriesData = data.data;
          }
        }
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  const fetchGlobalCatalogue = async () => {
    try {
      const response = await apiService.getGlobalCatalogue();
      if (response.success && response.data) {
        setGlobalCatalogue(response.data);
      }
    } catch (error) {
      console.error('Error fetching global catalogue:', error);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'discontinued': return 'destructive';
      case 'out_of_stock': return 'destructive';
      default: return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleAddProductSuccess = () => {
    setIsAddModalOpen(false);
    fetchProducts();
  };

  const handleProductAction = (product: Product, action: 'view' | 'edit' | 'delete') => {
    console.log('handleProductAction called:', { product: product.name, action });
    setSelectedProduct(product);
    setSelectedAction(action);
    setIsActionsModalOpen(true);
  };

  const handleActionsModalClose = () => {
    setIsActionsModalOpen(false);
    setSelectedProduct(null);
    setSelectedAction(null);
  };

  const handleImageClick = (imageUrl: string | null) => {
    setSelectedImage(imageUrl);
    setImageModalOpen(true);
  };

  const closeImageModal = () => {
    setImageModalOpen(false);
    setSelectedImage(null);
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeImageModal();
      }
    };

    if (imageModalOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [imageModalOpen]);

  const getScopeIcon = (scope: string) => {
    return scope === 'global' ? <Globe className="w-4 h-4" /> : <Store className="w-4 h-4" />;
  };

  const getScopeLabel = (scope: string) => {
    return scope === 'global' ? 'Global' : 'Store';
  };

  const getScopeBadgeVariant = (scope: string) => {
    return scope === 'global' ? 'default' : 'secondary';
  };

  // Get unique store names for filter
  const storeNames = Array.from(new Set(products.map(p => p.store_name).filter(Boolean))) as string[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your product catalog and inventory
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center rounded border border-border overflow-hidden">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              onClick={() => setViewMode('table')}
              className="rounded-none"
              size="sm"
            >
              Table View
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              onClick={() => setViewMode('grid')}
              className="rounded-none border-l border-border"
              size="sm"
            >
              Grid View
            </Button>
          </div>
          <Button 
            variant="outline" 
            onClick={() => {
              setShowGlobalCatalogue(!showGlobalCatalogue);
              if (!showGlobalCatalogue && !globalCatalogue) {
                fetchGlobalCatalogue();
              }
            }}
          >
            <Globe className="w-4 h-4 mr-2" />
            {showGlobalCatalogue ? 'Hide' : 'Show'} Global Catalogue
          </Button>
          <Button onClick={() => setIsCategoriesModalOpen(true)}>
            <Tag className="w-4 h-4 mr-2" />
            Categories
          </Button>
          <Button onClick={() => {
            console.log('Add Product button clicked, setting isAddModalOpen to true');
            setIsAddModalOpen(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Helpful Message for Products Without Images */}
      {products.length > 0 && products.filter(p => !getProductImageUrl(p)).length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-blue-600 mt-0.5">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900">Add Product Images</h3>
              <p className="text-sm text-blue-700 mt-1">
                {products.filter(p => !getProductImageUrl(p)).length} of your {products.length} products don't have images. 
                Click "Add Product" to create new products with images, or edit existing products to add images.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Global Catalogue View */}
      {showGlobalCatalogue && globalCatalogue && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Global Catalogue Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{globalCatalogue.total_products || 0}</div>
                <div className="text-sm text-muted-foreground">Total Products</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{globalCatalogue.stores_count || 0}</div>
                <div className="text-sm text-muted-foreground">Stores</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {globalCatalogue.catalogue?.length || 0}
            </div>
                <div className="text-sm text-muted-foreground">Product Types</div>
              </div>
            </div>
            
            {globalCatalogue.catalogue && globalCatalogue.catalogue.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Product Distribution:</h4>
                {globalCatalogue.catalogue.slice(0, 10).map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="font-medium">{item.product_name}</span>
                    <span className="text-sm text-muted-foreground">
                      {item.total_quantity} units across {item.inventory_by_store?.length || 0} stores
                    </span>
              </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
              />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={scopeFilter} onValueChange={(value: 'all' | 'global' | 'store') => setScopeFilter(value)}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scopes</SelectItem>
                <SelectItem value="global">Global</SelectItem>
                <SelectItem value="store">Store</SelectItem>
              </SelectContent>
            </Select>
            {storeNames.length > 0 && (
              <Select value={storeFilter} onValueChange={setStoreFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Store" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stores</SelectItem>
                  {storeNames.map((storeName) => (
                    <SelectItem key={storeName} value={storeName}>
                      {storeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Products Table or Grid */}
          {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground">Loading products...</p>
            </div>
            </div>
          ) : (
        <>
          {viewMode === 'table' ? (
            <DataTable<any>
              data={products as any}
              loading={false}
              searchable={false}
              columns={([
                { key: 'name', title: 'Name', sortable: true, render: (_v, row) => {
                  const url = getProductImageUrl(row as any);
                  const emoji = getProductEmoji(row as any);
                  return (
                    <div className="flex items-center gap-3">
                      {url ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <img src={url} alt={(row as any).name}
                                 className="w-10 h-10 rounded object-cover border"
                                 onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
                          </TooltipTrigger>
                          <TooltipContent>
                            <img src={url} alt={(row as any).name} className="max-w-[200px] max-h-[200px] object-contain" />
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <span className="text-xl">{emoji}</span>
                      )}
                      <div className="min-w-0">
                        <div className="font-medium truncate" title={(row as any).name}>{(row as any).name}</div>
                        <div className="text-xs text-muted-foreground">SKU: {(row as any).sku}</div>
                      </div>
                    </div>
                  );
                } },
                { key: 'category', title: 'Category', sortable: true },
                { key: 'price', title: 'Price', sortable: true, render: (v) => formatCurrency(Number(v || 0)) },
                { key: 'quantity', title: 'Stock', sortable: true, render: (v, row) => (
                  <div>
                    <div className="font-medium">{(row as any).quantity ?? (row as any).stock_quantity ?? 0}</div>
                    {(row as any).is_low_stock && <div className="text-xs text-yellow-600">Low stock</div>}
                  </div>
                ) },
                { key: 'status', title: 'Status', sortable: true, render: (v) => (
                  <Badge variant={getStatusBadgeVariant(String(v || 'active'))}>{String(v || 'active').replace('_',' ')}</Badge>
                ) },
                { key: 'created_at', title: 'Created', sortable: true, render: (v) => v ? formatDate(String(v)) : '—' },
              ]) as Column<any>[]}
              onRowClick={(row) => handleProductAction(row as any as Product, 'view')}
              onFilter={() => {
                const el = document.getElementById('filters');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              onExport={undefined}
              exportFilename={'products.csv'}
              onViewRow={(row) => handleProductAction(row as any as Product, 'view')}
              onEditRow={(row) => handleProductAction(row as any as Product, 'edit')}
              onDeleteRow={(row) => handleProductAction(row as any as Product, 'delete')}
              actions={null}
            />
          ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="relative">
                {(() => {
                  const imageUrl = getProductImageUrl(product);
                  const productEmoji = getProductEmoji(product);
                  
                  return imageUrl && imageUrl !== '' ? (
                    <>
                      <img
                        src={imageUrl}
                        alt={product.name || 'Product'}
                        className="w-full h-48 object-cover cursor-pointer hover:scale-105 transition-transform duration-200 animate-pulse bg-gray-200"
                        onClick={() => handleImageClick(imageUrl)}
                        onError={(e) => {
                          // Fallback to emoji if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                        onLoad={(e) => {
                          // Hide loading state when image loads successfully
                          const target = e.target as HTMLImageElement;
                          target.classList.remove('animate-pulse', 'bg-gray-200');
                        }}
                      />
                      <div 
                        className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center cursor-pointer hidden"
                        onClick={() => handleImageClick(null)}
                      >
                        <span className="text-6xl mb-2">{productEmoji}</span>
                        <span className="text-xs text-gray-500">Image Failed to Load</span>
                      </div>
                    </>
                  ) : (
                    <div 
                      className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-150 transition-colors duration-200"
                      onClick={() => handleImageClick(null)}
                    >
                      <span className="text-6xl mb-2">{productEmoji}</span>
                      <span className="text-xs text-gray-500">No Image</span>
                    </div>
                  );
                })()}
                
                {/* Scope Badge */}
                <div className="absolute top-2 left-2">
                  <Badge variant={getScopeBadgeVariant(product.scope || 'store')} className="text-xs">
                    {getScopeIcon(product.scope || 'store')}
                    <span className="ml-1">{getScopeLabel(product.scope || 'store')}</span>
                  </Badge>
                </div>

                {/* Store Badge */}
                {product.store_name && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="outline" className="text-xs">
                      {product.store_name}
                    </Badge>
                              </div>
                            )}

                {/* Status Badge */}
                                <div className="absolute bottom-2 left-2">
                  <Badge variant={getStatusBadgeVariant(product.status || 'active')}>
                    {(product.status || 'active').replace('_', ' ')}
                  </Badge>
                </div>
                        </div>

              <CardContent className="p-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg truncate" title={product.name}>
                    {product.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                  
                  {product.category && (
                    <p className="text-sm text-muted-foreground">
                      Category: {product.category}
                    </p>
                  )}

                  <div className="flex justify-between items-center">
                                                <div>
                          <p className="text-lg font-bold">
                            {formatCurrency(product.current_price || product.selling_price || product.price || 0)}
                          </p>
                          {product.discount_price && product.discount_price !== (product.selling_price || product.price) && (
                            <p className="text-sm text-muted-foreground line-through">
                              {formatCurrency(product.selling_price || product.price || 0)}
                            </p>
                          )}
                        </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        Stock: {product.quantity}
                      </p>
                      {product.is_low_stock && (
                        <p className="text-xs text-yellow-600">Low Stock</p>
                      )}
                          </div>
                        </div>

                  <div className="flex justify-between items-center pt-2">
                    <div className="flex gap-1">
                      {product.is_featured && (
                        <Badge variant="secondary" className="text-xs">Featured</Badge>
                      )}
                      {product.is_bestseller && (
                        <Badge variant="secondary" className="text-xs">Best Seller</Badge>
                      )}
                      {!getProductImageUrl(product) && (
                        <Badge variant="outline" className="text-xs text-orange-600">No Image</Badge>
                      )}
                    </div>
                    
                    <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleProductAction(product, 'view')}>
                          <Eye className="w-4 h-4 mr-2" />
                          View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleProductAction(product, 'edit')}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                            </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleProductAction(product, 'delete')}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
            </div>
          )}
        </>
          )}

      {!loading && products.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <Package className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm || categoryFilter !== 'all' || scopeFilter !== 'all' || storeFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by adding your first product'}
            </p>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
        </CardContent>
      </Card>
      )}
      
      {/* Modals */}
      <AddProductModal 
        isOpen={isAddModalOpen}
        onClose={() => {
          console.log('AddProductModal onClose called, setting isAddModalOpen to false');
          setIsAddModalOpen(false);
        }}
        onSuccess={handleAddProductSuccess} 
      />
      
      <CategoriesModal
        isOpen={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
        onSuccess={() => {
          setIsCategoriesModalOpen(false);
          fetchCategories();
        }}
      />
      
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          setIsImportModalOpen(false);
          fetchProducts();
        }}
      />
      
      {selectedProduct && (
      <ProductActionsModal
        isOpen={isActionsModalOpen}
        onClose={handleActionsModalClose}
        product={selectedProduct}
          action={selectedAction!}
          onSuccess={() => {
            handleActionsModalClose();
            fetchProducts();
          }}
        />
      )}

      {/* Image Modal */}
      {imageModalOpen && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative max-w-4xl max-h-[90vh]">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 z-10 bg-white"
              onClick={closeImageModal}
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
    </div>
  );
}