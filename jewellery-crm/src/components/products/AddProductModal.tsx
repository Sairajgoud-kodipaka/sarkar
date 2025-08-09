'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Package, Plus, Loader2, X, Upload, Image as ImageIcon } from 'lucide-react';
import { apiService } from '@/lib/api-service';
import { uploadImage, validateImage } from '@/lib/image-upload';

interface AddProductModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

export default function AddProductModal({ isOpen, onClose, onSuccess }: AddProductModalProps) {
  const [open, setOpen] = useState(false);
  
  // Use external state if provided, otherwise use internal state
  const isModalOpen = isOpen !== undefined ? isOpen : open;
  const handleClose = onClose || (() => setOpen(false));
  
  // Debug logging
  console.log('AddProductModal render:', { isOpen, isModalOpen, open });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<Array<{id: number, name: string}>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Category creation state
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: ''
  });
  const [creatingCategory, setCreatingCategory] = useState(false);

  // Form data matching EXACT database schema
  const [formData, setFormData] = useState({
    name: '',                    // text NOT NULL
    sku: '',                     // text NOT NULL UNIQUE
    type: 'Necklace',            // text NOT NULL
    category: '',                // text NOT NULL
    price: '',                   // numeric NOT NULL CHECK (price >= 0)
    image: '',                   // text (optional)
    description: '',             // text (optional)
    stock_quantity: '0',         // integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0)
    status: 'active' as 'active' | 'inactive'    // text DEFAULT 'active'
  });

  // Image preview state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // Generate a unique SKU based on product name and timestamp
  const generateUniqueSKU = (productName: string) => {
    const timestamp = Date.now().toString().slice(-4);
    const namePrefix = productName
      .replace(/[^A-Za-z]/g, '')
      .toUpperCase()
      .slice(0, 3);
    return `${namePrefix}-${timestamp}`;
  };

  // Fetch categories when modal opens
  useEffect(() => {
    if (isModalOpen) {
      fetchCategories();
    }
  }, [isModalOpen]);

  const fetchCategories = async () => {
    try {
      const response = await apiService.getCategories();
      if (response.success && response.data) {
        setCategories(response.data);
        // Set first category as default if none selected
        if (!formData.category && response.data.length > 0) {
          setFormData(prev => ({ ...prev, category: response.data[0].name }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
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
      const result = await uploadImage(selectedFile);
      if (result.error) {
        // Show error message in a more user-friendly way
        const errorMessage = document.createElement('div');
        errorMessage.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        errorMessage.textContent = `❌ Upload failed: ${result.error}`;
        document.body.appendChild(errorMessage);
        setTimeout(() => {
          document.body.removeChild(errorMessage);
        }, 5000);
        return;
      }

      setFormData({ ...formData, image: result.url });
      console.log('Image uploaded successfully:', result.url);
      // Show success message in a more user-friendly way
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      successMessage.textContent = '✅ Image uploaded successfully!';
      document.body.appendChild(successMessage);
      setTimeout(() => {
        document.body.removeChild(successMessage);
      }, 3000);
    } catch (error) {
      console.error('Upload error:', error);
      // Show error message in a more user-friendly way
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
    setFormData({ ...formData, image: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) {
      alert('Category name is required');
      return;
    }

    setCreatingCategory(true);
    try {
      const response = await apiService.createCategory({
        name: newCategory.name.trim(),
        description: newCategory.description.trim() || undefined
      });

      if (response.success) {
        // Add new category to the list
        const categoryToAdd = {
          id: Date.now(), // Temporary ID
          name: newCategory.name.trim()
        };
        setCategories(prev => [...prev, categoryToAdd]);
        
        // Set the new category as selected
        setFormData(prev => ({ ...prev, category: newCategory.name.trim() }));
        
        // Reset form
        setNewCategory({ name: '', description: '' });
        setShowCategoryForm(false);
        
        alert('Category created successfully!');
      } else {
        throw new Error(response.message || 'Failed to create category');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Failed to create category. Please try again.');
    } finally {
      setCreatingCategory(false);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      alert('Product name is required');
      return false;
    }
    if (!formData.sku.trim()) {
      alert('SKU is required');
      return false;
    }
    if (!formData.category.trim()) {
      alert('Category is required');
      return false;
    }
    if (!formData.price || parseFloat(formData.price) < 0) {
      alert('Price must be a positive number');
      return false;
    }
    if (parseInt(formData.stock_quantity) < 0) {
      alert('Stock quantity cannot be negative');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      // Prepare product data matching EXACT database schema
      const productData = {
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        type: formData.type,
        category: formData.category.trim(),
        price: parseFloat(formData.price),
        image: formData.image || undefined,
        image_url: formData.image || undefined, // Also save to image_url field for compatibility
        description: formData.description.trim() || undefined,
        stock_quantity: parseInt(formData.stock_quantity),
        status: formData.status
      };

      console.log('Creating product with data:', productData);
      const result = await apiService.createProduct(productData);
      
      if (result.success) {
        console.log('Product created successfully:', result.data);
        if (isOpen !== undefined) {
          handleClose();
        } else {
          setOpen(false);
        }
        // Reset form to initial state
        setFormData({
          name: '',
          sku: '',
          type: 'Necklace',
          category: '',
          price: '',
          image: '',
          description: '',
          stock_quantity: '0',
          status: 'active'
        });
        // Reset image preview
        setSelectedFile(null);
        setPreviewUrl('');
        onSuccess?.();
        alert('Product created successfully!');
      } else {
        throw new Error(result.message || 'Failed to create product');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      
      // Provide specific error messages
      if (error instanceof Error) {
        if (error.message.includes('duplicate key value violates unique constraint "products_sku_key"')) {
          alert('A product with this SKU already exists. Please use a unique SKU.');
        } else if (error.message.includes('duplicate key')) {
          alert('This product already exists. Please use a unique SKU.');
        } else {
          alert(`Failed to create product: ${error.message}`);
        }
      } else {
        alert('Failed to create product. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Custom Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add New Product</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Product Name - Required */}
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Gold Diamond Ring"
                  required
                />
              </div>

              {/* SKU - Required, Unique */}
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <div className="flex gap-2">
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g., GOLD-RING-001"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (formData.name) {
                        const uniqueSKU = generateUniqueSKU(formData.name);
                        setFormData({ ...formData, sku: uniqueSKU });
                      } else {
                        alert('Please enter a product name first to generate SKU');
                      }
                    }}
                  >
                    Generate
                  </Button>
                </div>
              </div>

              {/* Product Type & Category - Required */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Product Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
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
                  <div className="space-y-2">
                    <Select value={formData.category} onValueChange={(value) => {
                      if (value === 'create-new') {
                        setShowCategoryForm(true);
                      } else {
                        setFormData({ ...formData, category: value });
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="create-new" className="text-blue-600 font-medium">
                          + Create New Category
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {/* Create Category Form */}
                    {showCategoryForm && (
                      <div className="p-3 border rounded-lg bg-gray-50">
                        <div className="space-y-2">
                          <Label htmlFor="new-category-name">New Category Name *</Label>
                          <Input
                            id="new-category-name"
                            value={newCategory.name}
                            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                            placeholder="e.g., Diamond, Gold, Silver"
                          />
                          
                          <Label htmlFor="new-category-description">Description</Label>
                          <Textarea
                            id="new-category-description"
                            value={newCategory.description}
                            onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                            placeholder="Category description..."
                            rows={2}
                          />
                          
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleCreateCategory}
                              disabled={creatingCategory}
                            >
                              {creatingCategory && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                              Create Category
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setShowCategoryForm(false);
                                setNewCategory({ name: '', description: '' });
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
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
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
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
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
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
                    ref={fileInputRef}
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
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Product description..."
                  rows={3}
                />
              </div>

              {/* Status - Required */}
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as 'active' | 'inactive' })}>
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
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add Product
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
} 