'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { apiService } from '@/lib/api-service';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, X, Edit, Trash2, Eye, Copy, Archive } from 'lucide-react';
import ImageUpload from './ImageUpload';
import { uploadImage } from '@/lib/image-upload';
import { getProductImageUrl } from '@/lib/utils';

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
}

export default function ProductActionsModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  product, 
  action 
}: ProductActionsModalProps) {
  const { user } = useAuth();
  const MATERIAL_OPTIONS = ['Gold', 'Silver', 'Platinum', 'Diamond', 'Pearl'];
  const COLOR_OPTIONS = ['Yellow', 'White', 'Rose', 'Two-tone'];
  const KARAT_OPTIONS = ['14K', '18K', '22K', '24K'];
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
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [mainImageUrl, setMainImageUrl] = useState<string | undefined>(undefined);
  const [additionalImagesUrls, setAdditionalImagesUrls] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  // Select helpers for material/color/karat (size)
  const getSelectValue = (val: string, opts: string[]) => (opts.includes((val || '').trim()) ? (val || '').trim() : val ? 'custom' : '');
  const [materialSelect, setMaterialSelect] = useState<string>('');
  const [colorSelect, setColorSelect] = useState<string>('');
  const [karatSelect, setKaratSelect] = useState<string>('');
  const [categorySelect, setCategorySelect] = useState<string>('');

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
        });
        
        // Set image URLs for display
        setMainImageUrl(getProductImageUrl(product));
        setAdditionalImagesUrls(product.additional_images_urls || []);

        // Initialize selects
        setMaterialSelect(getSelectValue(product.material || '', MATERIAL_OPTIONS));
        setColorSelect(getSelectValue(product.color || '', COLOR_OPTIONS));
        setKaratSelect(getSelectValue(product.size || product.karat || '', KARAT_OPTIONS));

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
      // Upload new main image first (if provided)
      let uploadedMainUrl: string | undefined = undefined;
      if (mainImage) {
        const result = await uploadImage(mainImage);
        if (result.error) {
          throw new Error(`Image upload failed: ${result.error}`);
        }
        uploadedMainUrl = result.url;
      }

      // Upload additional images if provided
      let uploadedAdditionalUrls: string[] = [];
      if (additionalImages && additionalImages.length > 0) {
        for (const file of additionalImages) {
          const res = await uploadImage(file);
          if (res.url) uploadedAdditionalUrls.push(res.url);
        }
      }

      // Build updates object (plain JSON) for DB
      const updates: Record<string, any> = {
        name: formData.name,
        sku: formData.sku,
        description: formData.description,
        category: formData.category,
        cost_price: formData.cost_price,
        selling_price: formData.selling_price,
        discount_price: formData.discount_price || null,
        quantity: formData.quantity,
        min_quantity: formData.min_quantity,
        max_quantity: formData.max_quantity,
        weight: formData.weight,
        dimensions: formData.dimensions,
        material: formData.material,
        color: formData.color,
        size: formData.size,
        status: formData.status,
        is_featured: formData.is_featured,
        is_bestseller: formData.is_bestseller,
      };

      // Persist image URL fields if uploaded
      if (uploadedMainUrl) {
        updates.image = uploadedMainUrl;
        updates.image_url = uploadedMainUrl;
        updates.main_image_url = uploadedMainUrl;
      }
      if (uploadedAdditionalUrls.length > 0) {
        updates.additional_images_urls = uploadedAdditionalUrls;
      }

      // Preserve store assignment if your schema supports it (optional)
      const userStore = (user as any)?.user_metadata?.store ?? (user as any)?.user_metadata?.store_id;
      if (userStore !== undefined && userStore !== null) {
        updates.store = userStore;
      } else if (product.store !== undefined && product.store !== null) {
        updates.store = product.store;
      }

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

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImageModalOpen(true);
  };

  const closeImageModal = () => {
    setImageModalOpen(false);
    setSelectedImage(null);
  };

  // Add keyboard support for closing image modal
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && imageModalOpen) {
        closeImageModal();
      }
    };

    if (imageModalOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [imageModalOpen]);

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

  // Debug logging
  console.log('ProductActionsModal render:', { isOpen, product: product?.name, action });
  
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
              const mainUrl = getProductImageUrl(product);
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
                          className="w-48 h-48 object-cover rounded-lg border cursor-pointer hover:scale-105 transition-transform duration-200"
                            onClick={() => handleImageClick(mainUrl)}
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
                              className="w-24 h-24 object-cover rounded-lg border cursor-pointer hover:scale-105 transition-transform duration-200"
                              onClick={() => handleImageClick(imageUrl)}
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
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  placeholder="Enter SKU"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter product description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={categorySelect}
                  onValueChange={(value) => {
                    setCategorySelect(value);
                    const cat = categories.find((c) => String(c.id) === value);
                    handleInputChange('category', cat?.name || '');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.category || 'Select category'} />
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

              {/* Brand field removed */}
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost_price">Cost Price *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <Input
                    id="cost_price"
                    type="text"
                    value={formData.cost_price === 0 ? '' : formData.cost_price.toString()}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, '');
                      handleInputChange('cost_price', value ? parseFloat(value) : 0);
                    }}
                    placeholder="0.00"
                    className="pl-8"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="selling_price">Selling Price *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <Input
                    id="selling_price"
                    type="text"
                    value={formData.selling_price === 0 ? '' : formData.selling_price.toString()}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, '');
                      handleInputChange('selling_price', value ? parseFloat(value) : 0);
                    }}
                    placeholder="0.00"
                    className="pl-8"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount_price">Discount Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <Input
                    id="discount_price"
                    type="text"
                    value={formData.discount_price === 0 ? '' : formData.discount_price.toString()}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, '');
                      handleInputChange('discount_price', value ? parseFloat(value) : 0);
                    }}
                    placeholder="0.00"
                    className="pl-8"
                  />
                </div>
              </div>
            </div>

            {/* Inventory */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                  placeholder="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="min_quantity">Min Quantity</Label>
                <Input
                  id="min_quantity"
                  type="number"
                  value={formData.min_quantity}
                  onChange={(e) => handleInputChange('min_quantity', parseInt(e.target.value) || 1)}
                  placeholder="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_quantity">Max Quantity</Label>
                <Input
                  id="max_quantity"
                  type="number"
                  value={formData.max_quantity}
                  onChange={(e) => handleInputChange('max_quantity', parseInt(e.target.value) || 100)}
                  placeholder="100"
                />
              </div>
            </div>

            {/* Product Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="material">Material</Label>
                <Select
                  value={materialSelect || getSelectValue(formData.material, MATERIAL_OPTIONS)}
                  onValueChange={(value) => {
                    setMaterialSelect(value);
                    if (value === 'custom') {
                      handleInputChange('material', formData.material || '');
                    } else {
                      handleInputChange('material', value);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    {MATERIAL_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                    <SelectItem value="custom">Custom…</SelectItem>
                  </SelectContent>
                </Select>
                {materialSelect === 'custom' && (
                <Input
                  id="material"
                  value={formData.material}
                  onChange={(e) => handleInputChange('material', e.target.value)}
                  placeholder="e.g., Gold, Silver, Platinum"
                />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Select
                  value={colorSelect || getSelectValue(formData.color, COLOR_OPTIONS)}
                  onValueChange={(value) => {
                    setColorSelect(value);
                    if (value === 'custom') {
                      handleInputChange('color', formData.color || '');
                    } else {
                      handleInputChange('color', value);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    {COLOR_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                    <SelectItem value="custom">Custom…</SelectItem>
                  </SelectContent>
                </Select>
                {colorSelect === 'custom' && (
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                  placeholder="e.g., Yellow, White, Rose"
                />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (g)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.01"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="size">Karat</Label>
                <Select
                  value={karatSelect || getSelectValue(formData.size, KARAT_OPTIONS)}
                  onValueChange={(value) => {
                    setKaratSelect(value);
                    if (value === 'custom') {
                      handleInputChange('size', formData.size || '');
                    } else {
                      handleInputChange('size', value);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select karat" />
                  </SelectTrigger>
                  <SelectContent>
                    {KARAT_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                    <SelectItem value="custom">Custom…</SelectItem>
                  </SelectContent>
                </Select>
                {karatSelect === 'custom' && (
                <Input
                  id="size"
                  value={formData.size}
                  onChange={(e) => handleInputChange('size', e.target.value)}
                  placeholder="e.g., 18K, 22K"
                />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dimensions">Dimensions</Label>
                <Input
                  id="dimensions"
                  value={formData.dimensions}
                  onChange={(e) => handleInputChange('dimensions', e.target.value)}
                  placeholder="e.g., 10x5x2 cm"
                />
              </div>
            </div>

            {/* Image Upload */}
            <ImageUpload
              mainImage={mainImageUrl}
              additionalImages={additionalImagesUrls}
              onMainImageChange={setMainImage}
              onAdditionalImagesChange={setAdditionalImages}
            />

            {/* Status and Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Product Features</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_featured"
                      checked={formData.is_featured}
                      onCheckedChange={(checked) => handleInputChange('is_featured', checked)}
                    />
                    <Label htmlFor="is_featured">Featured Product</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_bestseller"
                      checked={formData.is_bestseller}
                      onCheckedChange={(checked) => handleInputChange('is_bestseller', checked)}
                    />
                    <Label htmlFor="is_bestseller">Best Seller</Label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Product'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                Cancel
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

      {/* Image Modal for Enlarged View */}
      {imageModalOpen && selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60]"
          onClick={closeImageModal}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={closeImageModal}
              className="absolute top-2 right-2 z-10 bg-white/20 hover:bg-white/30 text-white"
            >
              <X className="h-6 w-6" />
            </Button>
            <img
              src={selectedImage}
              alt="Enlarged product image"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
} 