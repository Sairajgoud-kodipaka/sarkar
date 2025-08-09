import { supabase } from './supabase';

export interface UploadResult {
  url: string;
  path: string;
  error?: string;
}

export const uploadImage = async (file: File): Promise<UploadResult> => {
  try {
    console.log('🚀 Starting image upload...');
    console.log('📁 File details:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Generate a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `products/${fileName}`;

    console.log('📂 File path:', filePath);

    // Check if we can access storage
    console.log('🔍 Checking storage access...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      return { 
        url: '', 
        path: '', 
        error: `Storage access error: ${bucketsError.message}` 
      };
    }

    console.log('📦 Available buckets:', buckets?.map(b => b.name));

    const productImagesBucket = buckets?.find(bucket => bucket.name === 'product-images');
    
    if (!productImagesBucket) {
      console.error('❌ product-images bucket not found!');
      console.log('📋 Available buckets:', buckets?.map(b => b.name));
      return { 
        url: '', 
        path: '', 
        error: 'product-images bucket not found. Available buckets: ' + buckets?.map(b => b.name).join(', ') 
      };
    }

    console.log('✅ Found product-images bucket');

    // Upload the file to Supabase Storage
    console.log('📤 Uploading file to Supabase Storage...');
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Upload error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        statusCode: error.statusCode,
        error: error.error
      });
      
      // If bucket doesn't exist, return error
      if (error.message.includes('bucket') || error.message.includes('not found')) {
        console.log('❌ Storage bucket not available');
        return {
          url: '',
          path: filePath,
          error: 'Storage bucket not configured'
        };
      }
      
      return { url: '', path: '', error: error.message };
    }

    console.log('✅ File uploaded successfully:', data);

    // Get the public URL
    console.log('🔗 Getting public URL...');
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    console.log('✅ Public URL generated:', publicUrl);

    return {
      url: publicUrl,
      path: filePath
    };
  } catch (error) {
    console.error('💥 Upload failed with exception:', error);
    return { 
      url: '', 
      path: '', 
      error: error instanceof Error ? error.message : 'Upload failed' 
    };
  }
};

export const deleteImage = async (path: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from('product-images')
      .remove([path]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete failed:', error);
    return false;
  }
};

export const validateImage = (file: File): string | null => {
  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return 'Image size must be less than 5MB';
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return 'Only JPEG, PNG, and WebP images are allowed';
  }

  return null;
};
