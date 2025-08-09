const { createClient } = require('@supabase/supabase-js');

// Your actual Supabase credentials
const supabaseUrl = 'https://wwyespebfotedtbphttp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3eWVzcGViZm90ZWR0YnBodHRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MjY1MjksImV4cCI6MjA3MDIwMjUyOX0.g6AM1DR4A-qE8uS054qhL5BktnUxJ3MdXH7SCmn6S3M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStorageSetup() {
  console.log('Testing Supabase Storage setup...');
  
  try {
    // Test 1: Check if product-images bucket exists
    console.log('\n1. Checking if product-images bucket exists...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return;
    }
    
    const productImagesBucket = buckets.find(bucket => bucket.name === 'product-images');
    if (productImagesBucket) {
      console.log('✅ product-images bucket exists');
      console.log('Bucket details:', productImagesBucket);
    } else {
      console.log('❌ product-images bucket does not exist');
      console.log('Available buckets:', buckets.map(b => b.name));
    }
    
    // Test 2: Check products table structure
    console.log('\n2. Checking products table structure...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (productsError) {
      console.error('Error fetching products:', productsError);
      return;
    }
    
    if (products && products.length > 0) {
      const product = products[0];
      console.log('Sample product structure:', Object.keys(product));
      
      if ('image_url' in product) {
        console.log('✅ image_url field exists in products table');
        console.log('Sample image_url value:', product.image_url);
      } else {
        console.log('❌ image_url field does not exist in products table');
      }
    } else {
      console.log('No products found in table');
    }
    
    // Test 3: Try to upload a test file
    console.log('\n3. Testing file upload...');
    const testContent = Buffer.from('test content');
    const fileName = `test-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(`test/${fileName}`, testContent);
    
    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError);
    } else {
      console.log('✅ Upload test successful');
      console.log('Uploaded file:', uploadData);
      
      // Clean up test file
      const { error: deleteError } = await supabase.storage
        .from('product-images')
        .remove([`test/${fileName}`]);
      
      if (deleteError) {
        console.log('Warning: Could not delete test file:', deleteError);
      } else {
        console.log('✅ Test file cleaned up');
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testStorageSetup();
