'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { apiService } from '@/lib/api-service';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, X, Edit, Trash2, Eye, Copy, Archive, Upload } from 'lucide-react';
import { uploadImage, validateImage } from '@/lib/image-upload';

interface ProductActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: any;
  action: 'view' | 'edit' | 'delete' | null;
}

interface Category {
  id: number;
  name: string;
  description?: string;
}

interface ProductFormData {
  name: string;
  sku: string;
  description: string;
  category: string;
  cost_price: number;
  selling_price: number;
  discount_price: number;
  quantity: number;
  min_quantity: number;
  max_quantity: number;
  weight: number;
  dimensions: string;
  material: string;
  color: string;
  size: string;
  status: string;
  is_featured: boolean;
  is_bestseller: boolean;
  type: string;
  price: number;
  stock_quantity: number;
  image: string;
}

export default function ProductActionsModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  product, 
  action 
}: ProductActionsModalProps) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    sku: '',
    description: '',
    category: '',
    cost_price: 0,
    selling_price: 0,
    discount_price: 0,
    quantity: 0,
    min_quantity: 1,
    max_quantity: 100,
    weight: 0,
    dimensions: '',
    material: '',
    color: '',
    size: '',
    status: 'active',
    is_featured: false,
    is_bestseller: false,
    type: 'Necklace',
    price: 0,
    stock_quantity: 0,
    image: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categorySelect, setCategorySelect] = useState<string>('');
  
  // Image upload state
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  React.useEffect(() => {
    if (isOpen && product) {
      fetchCategories();
      if (action === 'edit') {
        setFormData({
          name: product.name || '',
          sku: product.sku || '',
          description: product.description || '',
          category: (product.category_name || product.category || '').toString() || '',
          cost_price: product.cost_price || 0,
          selling_price: product.selling_price || product.price || 0,
          discount_price: product.discount_price || 0,
          quantity: product.quantity || product.stock_quantity || 0,
          min_quantity: product.min_quantity || 1,
          max_quantity: product.max_quantity || 100,
          weight: product.weight || 0,
          dimensions: product.dimensions || '',
          material: product.material || '',
          color: product.color || '',
          size: product.size || product.karat || '',
          status: product.status || 'active',
          is_featured: product.is_featured || false,
          is_bestseller: product.is_bestseller || false,
          type: product.type || 'Necklace',
          price: product.price || 0,
          stock_quantity: product.stock_quantity || 0,
          image: product.image_url || '',
        });
        
        // Initialize category select by matching name or id
        setTimeout(() => {
          const cat = (categories || []).find((c) =>
            c.name?.toLowerCase() === String(product.category_name || product.category || '').toLowerCase() ||
            String(c.id) === String(product.category)
          );
          if (cat?.id) setCategorySelect(String(cat.id));
        }, 0);
      }
    }
  }, [isOpen, product, action]);

  const fetchCategories = async () => {
    try {
      const response = await apiService.getCategories();
      if (response.success) {
        const data = response.data as any;
        // Handle different response structures
        if (Array.isArray(data)) {
          setCategories(data);
        } else if (data && data.results && Array.isArray(data.results)) {
          setCategories(data.results);
        } else if (data && data.data && Array.isArray(data.data)) {
          setCategories(data.data);
        } else {
          setCategories([]);
        }
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategories([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Build updates object matching the simplified form fields
      const updates: Record<string, any> = {
        name: formData.name,
        sku: formData.sku,
        type: formData.type,
        category: formData.category,
        price: parseFloat(formData.price.toString()) || 0,
        description: formData.description,
        stock_quantity: parseInt(formData.stock_quantity.toString()) || 0,
        status: formData.status,
        image_url: formData.image || undefined,
        updated_at: new Date().toISOString()
      };

      const response = await apiService.updateProduct(product.id.toString(), updates);
      if (response.success) {
        onSuccess();
        onClose();
      } else {
        setError(response.message || 'Failed to update product');
      }
    } catch (error) {
      console.error('Failed to update product:', error);
      setError('Failed to update product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.deleteProduct(product.id.toString());
      if (response.success) {
        onSuccess();
        onClose();
      } else {
        setError(response.message || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
      setError('Failed to delete product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProductFormData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validationError = validateImage(file);
      if (validationError) {
        alert(validationError);
        return;
      }

      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const imageUrl = await uploadImage(selectedFile, product.id.toString());
      // Update the product's image URL
      setFormData(prev => ({ ...prev, image: imageUrl }));
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      successMessage.textContent = '✅ Image uploaded successfully!';
      document.body.appendChild(successMessage);
      setTimeout(() => {
        document.body.removeChild(successMessage);
      }, 3000);
    } catch (error) {
      console.error('Upload error:', error);
      // Show error message
      const errorMessage = document.createElement('div');
      errorMessage.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      errorMessage.textContent = '❌ Failed to upload image. Please try again.';
      document.body.appendChild(errorMessage);
      setTimeout(() => {
        document.body.removeChild(errorMessage);
      }, 5000);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setFormData(prev => ({ ...prev, image: '' }));
  };

  // Add keyboard support for closing image modal
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Image modal functionality removed - simplified form
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'out_of_stock':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text-primary">
            {action === 'view' && 'View Product'}
            {action === 'edit' && 'Edit Product'}
            {action === 'delete' && 'Delete Product'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded mb-4">
            {error}
          </div>
        )}

        {action === 'view' && (
          <div className="space-y-6">
            {/* Product Images */}
            {(() => {
              const mainUrl = product.main_image_url;
              const gallery = product.additional_images_urls || [];
              const hasAny = !!mainUrl || (Array.isArray(gallery) && gallery.length > 0);
              if (!hasAny) {
                return (
                  <div>
                    <h3 className="font-semibold mb-3">Product Images</h3>
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <div className="text-gray-500">
                        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm">No images uploaded for this product</p>
                      </div>
                    </div>
                  </div>
                );
              }
              return (
              <div>
                <h3 className="font-semibold mb-3">Product Images</h3>
                <div className="space-y-4">
                    {mainUrl && (
                    <div>
                      <Label className="text-sm text-gray-600 mb-2">Main Image</Label>
                      <div className="relative">
                        <img
                            src={mainUrl}
                          alt={product.name}
                          className="w-48 h-48 object-cover rounded-lg border"
                        />
                      </div>
                    </div>
                  )}
                    {Array.isArray(gallery) && gallery.length > 0 && (
                    <div>
                      <Label className="text-sm text-gray-600 mb-2">Additional Images</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {gallery.map((imageUrl: string, index: number) => (
                          <div key={index} className="relative">
                            <img
                              src={imageUrl}
                              alt={`${product.name} - Image ${index + 1}`}
                              className="w-24 h-24 object-cover rounded-lg border"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              );
            })()}

            {/* Product Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Basic Information</h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm text-gray-600">Product Name</Label>
                    <p className="font-medium">{product.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">SKU</Label>
                    <p className="font-medium">{product.sku}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Category</Label>
                    <p className="font-medium">{product.category_name || 'Uncategorized'}</p>
                  </div>
                  {/* Brand removed */}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Pricing & Inventory</h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm text-gray-600">Selling Price</Label>
                    <p className="font-medium">{formatCurrency(product.selling_price)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Cost Price</Label>
                    <p className="font-medium">{formatCurrency(product.cost_price)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Quantity</Label>
                    <p className="font-medium">{product.quantity}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Status</Label>
                    <Badge variant={getStatusBadgeVariant(product.status)}>
                      {product.status?.charAt(0).toUpperCase() + product.status?.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {product.description && (
              <div>
                <Label className="text-sm text-gray-600">Description</Label>
                <p className="mt-1">{product.description}</p>
              </div>
            )}

            {/* Additional Product Details */}
            {(product.material || product.color || product.size || product.weight || product.dimensions) && (
              <div>
                <h3 className="font-semibold mb-3">Product Specifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {product.material && (
                    <div>
                      <Label className="text-sm text-gray-600">Material</Label>
                      <p className="font-medium">{product.material}</p>
                    </div>
                  )}
                  {product.color && (
                    <div>
                      <Label className="text-sm text-gray-600">Color</Label>
                      <p className="font-medium">{product.color}</p>
                    </div>
                  )}
                  {product.size && (
                    <div>
                      <Label className="text-sm text-gray-600">Size</Label>
                      <p className="font-medium">{product.size}</p>
                    </div>
                  )}
                  {product.weight && (
                    <div>
                      <Label className="text-sm text-gray-600">Weight (g)</Label>
                      <p className="font-medium">{product.weight}</p>
                    </div>
                  )}
                  {product.dimensions && (
                    <div>
                      <Label className="text-sm text-gray-600">Dimensions</Label>
                      <p className="font-medium">{product.dimensions}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => onClose()}
                variant="outline"
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        )}

        {action === 'edit' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Name - Required */}
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Gold Diamond Ring"
                required
              />
            </div>

            {/* SKU - Required, Unique */}
            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => handleInputChange('sku', e.target.value)}
                placeholder="e.g., GOLD-RING-001"
                required
              />
            </div>

            {/* Product Type & Category - Required */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Product Type *</Label>
                <Select value={formData.type || 'Necklace'} onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Necklace">Necklace</SelectItem>
                    <SelectItem value="Ring">Ring</SelectItem>
                    <SelectItem value="Earrings">Earrings</SelectItem>
                    <SelectItem value="Bangles">Bangles</SelectItem>
                    <SelectItem value="Bracelet">Bracelet</SelectItem>
                    <SelectItem value="Chain">Chain</SelectItem>
                    <SelectItem value="Pendant">Pendant</SelectItem>
                    <SelectItem value="Watch">Watch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={categorySelect}
                  onValueChange={(value) => {
                    setCategorySelect(value);
                    const cat = categories.find((c) => String(c.id) === value);
                    handleInputChange('category', cat?.name || '');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Price & Stock Quantity - Required */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price || ''}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock_quantity">Stock Quantity *</Label>
                <Input
                  id="stock_quantity"
                  type="number"
                  min="0"
                  value={formData.stock_quantity || ''}
                  onChange={(e) => handleInputChange('stock_quantity', e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
            </div>

            {/* Product Image - Optional */}
            <div className="space-y-2">
              <Label htmlFor="image">Product Image</Label>
              <div className="space-y-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="cursor-pointer"
                />
                
                {selectedFile && (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleUpload}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      {uploading ? 'Uploading...' : 'Upload Image'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleRemoveImage}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {/* Image Preview */}
                {(previewUrl || formData.image) && (
                  <div className="mt-2">
                    <div className="relative inline-block">
                      <img
                        src={previewUrl || formData.image}
                        alt="Product preview"
                        className="w-32 h-32 object-cover rounded border"
                      />
                      {formData.image && !previewUrl && (
                        <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded">
                          ✓ Uploaded
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {formData.image && (
                  <div className="text-sm text-green-600">
                    ✓ Image uploaded successfully
                  </div>
                )}
              </div>
            </div>

            {/* Description - Optional */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Product description..."
                rows={3}
              />
            </div>

            {/* Status - Required */}
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status || 'active'} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Update Product
              </Button>
            </div>
          </form>
        )}

        {action === 'delete' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Delete Product</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete "{product.name}"? This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleDelete}
                disabled={loading}
                variant="destructive"
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Product'
                )}
              </Button>
              <Button
                onClick={onClose}
                disabled={loading}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Image Modal for Enlarged View with easy close */}
      {/* Image modal functionality removed - simplified form */}
    </div>
  );
} 