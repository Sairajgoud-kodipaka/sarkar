const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testImageUploadFlow() {
  console.log('🔍 Testing complete image upload flow...\n');

  // Step 1: Check if product-images bucket exists
  console.log('1. Checking product-images bucket...');
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const productImagesBucket = buckets?.find(bucket => bucket.name === 'product-images');
    
    if (productImagesBucket) {
      console.log('✅ product-images bucket exists');
    } else {
      console.log('❌ product-images bucket does not exist');
      return;
    }
  } catch (error) {
    console.error('❌ Error checking buckets:', error.message);
    return;
  }

  // Step 2: Test file upload to storage
  console.log('\n2. Testing file upload to storage...');
  try {
    // Create a simple test file (simulating image upload)
    const testFileName = `test-${Date.now()}.txt`;
    const testFilePath = `products/${testFileName}`;
    const testContent = 'This is a test file for image upload verification';
    
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(testFilePath, testContent, {
        contentType: 'text/plain',
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Upload test failed:', error.message);
      return;
    }

    console.log('✅ File upload successful');
    console.log('   File path:', data.path);

    // Step 3: Get public URL
    console.log('\n3. Getting public URL...');
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(testFilePath);

    console.log('✅ Public URL generated:', publicUrl);

    // Step 4: Test product creation with image_url
    console.log('\n4. Testing product creation with image_url...');
    const testProduct = {
      name: 'Test Product with Image',
      sku: `TEST-IMG-${Date.now()}`,
      type: 'Necklace',
      category: 'Gold',
      price: 50000,
      stock_quantity: 5,
      description: 'Test product to verify image upload flow',
      image_url: publicUrl,
      status: 'active'
    };

    const { data: productData, error: productError } = await supabase
      .from('products')
      .insert([testProduct])
      .select()
      .single();

    if (productError) {
      console.error('❌ Product creation failed:', productError.message);
      return;
    }

    console.log('✅ Product created successfully');
    console.log('   Product ID:', productData.id);
    console.log('   Product Name:', productData.name);
    console.log('   Image URL:', productData.image_url);

    // Step 5: Verify product can be retrieved
    console.log('\n5. Verifying product retrieval...');
    const { data: retrievedProduct, error: retrieveError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productData.id)
      .single();

    if (retrieveError) {
      console.error('❌ Product retrieval failed:', retrieveError.message);
    } else {
      console.log('✅ Product retrieved successfully');
      console.log('   Retrieved Image URL:', retrievedProduct.image_url);
    }

    // Step 6: Clean up test data
    console.log('\n6. Cleaning up test data...');
    
    // Delete the test product
    const { error: deleteProductError } = await supabase
      .from('products')
      .delete()
      .eq('id', productData.id);

    if (deleteProductError) {
      console.error('❌ Failed to delete test product:', deleteProductError.message);
    } else {
      console.log('✅ Test product deleted');
    }

    // Delete the test file
    const { error: deleteFileError } = await supabase.storage
      .from('product-images')
      .remove([testFilePath]);

    if (deleteFileError) {
      console.error('❌ Failed to delete test file:', deleteFileError.message);
    } else {
      console.log('✅ Test file deleted');
    }

    console.log('\n🎉 Image upload flow test completed successfully!');
    console.log('✅ Storage bucket exists');
    console.log('✅ File upload works');
    console.log('✅ Public URL generation works');
    console.log('✅ Product creation with image_url works');
    console.log('✅ Product retrieval works');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testImageUploadFlow();
