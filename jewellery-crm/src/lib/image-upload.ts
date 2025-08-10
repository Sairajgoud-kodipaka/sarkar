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

    // Upload the file to Supabase Storage directly
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
        name: error.name,
        ...(error as any).statusCode && { statusCode: (error as any).statusCode }
      });
      
      // If bucket doesn't exist or access denied, return a clear message
      if (/not\s+found|does\s+not\s+exist|bucket/i.test(error.message)) {
        return {
          url: '',
          path: filePath,
          error: 'product-images bucket missing or not accessible. Ensure it exists and policies allow authenticated uploads.'
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
