const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Your actual Supabase credentials
const supabaseUrl = 'https://wwyespebfotedtbphttp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3eWVzcGViZm90ZWR0YnBodHRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MjY1MjksImV4cCI6MjA3MDIwMjUyOX0.g6AM1DR4A-qE8uS054qhL5BktnUxJ3MdXH7SCmn6S3M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixImageStorage() {
  console.log('Fixing image storage issues...');
  
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'setup-storage.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\nExecuting statement ${i + 1}/${statements.length}:`);
      console.log(statement.substring(0, 100) + '...');
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          console.log(`Statement ${i + 1} result:`, error.message);
        } else {
          console.log(`Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.log(`Statement ${i + 1} error:`, err.message);
      }
    }
    
    // Test the setup after applying changes
    console.log('\n\nTesting setup after fixes...');
    
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
      
      const imageFields = ['image', 'image_url', 'main_image_url', 'additional_images_urls'];
      imageFields.forEach(field => {
        if (field in product) {
          console.log(`✅ ${field} field exists`);
          if (product[field]) {
            console.log(`   Sample ${field} value:`, product[field]);
          }
        } else {
          console.log(`❌ ${field} field does not exist`);
        }
      });
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
    
    console.log('\n\nImage storage fix completed!');
    
  } catch (error) {
    console.error('Fix failed:', error);
  }
}

// Run the fix
fixImageStorage();
