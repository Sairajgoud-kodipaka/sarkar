-- Create a storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true);

-- Create a policy to allow public read access to product images
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');

-- Create a policy to allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- Create a policy to allow users to update their own uploads
CREATE POLICY "Users can update own uploads" ON storage.objects
FOR UPDATE USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create a policy to allow users to delete their own uploads
CREATE POLICY "Users can delete own uploads" ON storage.objects
FOR DELETE USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Update the products table to include image_url field if it doesn't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add a comment to the image_url column
COMMENT ON COLUMN products.image_url IS 'URL of the product image stored in Supabase Storage';
