const { createClient } = require('@supabase/supabase-js');

// Your actual Supabase credentials
const supabaseUrl = 'https://wwyespebfotedtbphttp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3eWVzcGViZm90ZWR0YnBodHRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MjY1MjksImV4cCI6MjA3MDIwMjUyOX0.g6AM1DR4A-qE8uS054qhL5BktnUxJ3MdXH7SCmn6S3M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testImageUpload() {
  console.log('Testing image upload functionality...');
  
  try {
    // Test 1: Check bucket exists and is accessible
    console.log('\n1. Checking bucket access...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return;
    }
    
    const productImagesBucket = buckets.find(bucket => bucket.name === 'product-images');
    if (productImagesBucket) {
      console.log('✅ product-images bucket exists and is accessible');
      console.log('Bucket details:', {
        name: productImagesBucket.name,
        public: productImagesBucket.public,
        id: productImagesBucket.id
      });
    } else {
      console.log('❌ product-images bucket not found');
      return;
    }
    
    // Test 2: Try to upload a test image
    console.log('\n2. Testing image upload...');
    const testImageContent = Buffer.from('fake-image-data');
    const fileName = `test-image-${Date.now()}.jpg`;
    const filePath = `products/${fileName}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, testImageContent, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError);
      
      // Check if it's a policy issue
      if (uploadError.message.includes('policy') || uploadError.message.includes('403')) {
        console.log('This appears to be a Row Level Security (RLS) policy issue.');
        console.log('The bucket exists but uploads are being blocked by security policies.');
      }
    } else {
      console.log('✅ Upload test successful');
      console.log('Uploaded file:', uploadData);
      
      // Test 3: Get public URL
      console.log('\n3. Testing public URL generation...');
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);
      
      console.log('✅ Public URL generated:', publicUrl);
      
      // Test 4: Clean up test file
      console.log('\n4. Cleaning up test file...');
      const { error: deleteError } = await supabase.storage
        .from('product-images')
        .remove([filePath]);
      
      if (deleteError) {
        console.log('Warning: Could not delete test file:', deleteError);
      } else {
        console.log('✅ Test file cleaned up');
      }
    }
    
    // Test 5: Check current products in database
    console.log('\n5. Checking current products...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(5);
    
    if (productsError) {
      console.error('Error fetching products:', productsError);
    } else {
      console.log(`Found ${products.length} products in database`);
      products.forEach((product, index) => {
        console.log(`Product ${index + 1}:`, {
          name: product.name,
          image_url: product.image_url,
          main_image_url: product.main_image_url,
          image: product.image
        });
      });
    }
    
    console.log('\n\nImage upload test completed!');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testImageUpload();
