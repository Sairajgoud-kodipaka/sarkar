-- Create a storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own uploads" ON storage.objects;

-- Create a policy to allow public read access to product images
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');

-- Create a policy to allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'product-images');

-- Create a policy to allow users to update their own uploads
CREATE POLICY "Users can update own uploads" ON storage.objects
FOR UPDATE USING (bucket_id = 'product-images');

-- Create a policy to allow users to delete their own uploads
CREATE POLICY "Users can delete own uploads" ON storage.objects
FOR DELETE USING (bucket_id = 'product-images');

-- Update the products table to include image_url field if it doesn't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add a comment to the image_url column
COMMENT ON COLUMN products.image_url IS 'URL of the product image stored in Supabase Storage';

-- Update existing products to use image_url instead of image field
UPDATE products 
SET image_url = image 
WHERE image IS NOT NULL AND image_url IS NULL;

-- Add additional image fields for better image management
ALTER TABLE products ADD COLUMN IF NOT EXISTS main_image_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS additional_images_urls TEXT[];

-- Update existing products to set main_image_url from image_url
UPDATE products 
SET main_image_url = image_url 
WHERE image_url IS NOT NULL AND main_image_url IS NULL;
