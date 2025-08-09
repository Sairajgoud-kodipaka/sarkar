import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wwyespebfotedtbphttp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3eWVzcGViZm90ZWR0YnBodHRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MjY1MjksImV4cCI6MjA3MDIwMjUyOX0.g6AM1DR4A-qE8uS054qhL5BktnUxJ3MdXH7SCmn6S3M';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createBucket() {
  try {
    console.log('🔧 Creating product-images bucket...');
    
    const { data, error } = await supabase.storage.createBucket('product-images', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      fileSizeLimit: 5242880 // 5MB
    });

    if (error) {
      console.error('❌ Error creating bucket:', error);
      return;
    }

    console.log('✅ Bucket created successfully:', data);
    
    // Set up public access policy
    const { error: policyError } = await supabase.storage
      .from('product-images')
      .createSignedUrl('test.txt', 60);

    if (policyError) {
      console.log('⚠️ Note: You may need to set up storage policies in Supabase dashboard');
    }

  } catch (error) {
    console.error('💥 Failed to create bucket:', error);
  }
}

createBucket();
