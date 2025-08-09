const { createClient } = require('@supabase/supabase-js');

// Your actual Supabase credentials
const supabaseUrl = 'https://wwyespebfotedtbphttp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3eWVzcGViZm90ZWR0YnBodHRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MjY1MjksImV4cCI6MjA3MDIwMjUyOX0.g6AM1DR4A-qE8uS054qhL5BktnUxJ3MdXH7SCmn6S3M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProducts() {
  console.log('Checking current products and image fields...');
  
  try {
    // Get all products
    const { data: products, error } = await supabase
      .from('products')
      .select('*');
    
    if (error) {
      console.error('Error fetching products:', error);
      return;
    }
    
    console.log(`Found ${products.length} products in database`);
    console.log('\nProduct details:');
    
    products.forEach((product, index) => {
      console.log(`\nProduct ${index + 1}:`);
      console.log(`  Name: ${product.name}`);
      console.log(`  SKU: ${product.sku}`);
      console.log(`  Price: ${product.price}`);
      console.log(`  Image fields:`);
      console.log(`    - image: ${product.image || 'null'}`);
      console.log(`    - image_url: ${product.image_url || 'null'}`);
      console.log(`    - main_image_url: ${product.main_image_url || 'null'}`);
      
      // Check if any image field has a value
      const hasImage = product.image || product.image_url || product.main_image_url;
      console.log(`  Has image: ${hasImage ? 'YES' : 'NO'}`);
      
      if (hasImage) {
        console.log(`  Image URL: ${product.image_url || product.main_image_url || product.image}`);
      }
    });
    
    // Summary
    const productsWithImages = products.filter(p => p.image || p.image_url || p.main_image_url);
    const productsWithoutImages = products.filter(p => !p.image && !p.image_url && !p.main_image_url);
    
    console.log('\n=== SUMMARY ===');
    console.log(`Total products: ${products.length}`);
    console.log(`Products with images: ${productsWithImages.length}`);
    console.log(`Products without images: ${productsWithoutImages.length}`);
    
    if (productsWithoutImages.length > 0) {
      console.log('\nProducts that need images:');
      productsWithoutImages.forEach(product => {
        console.log(`  - ${product.name} (SKU: ${product.sku})`);
      });
    }
    
  } catch (error) {
    console.error('Check failed:', error);
  }
}

// Run the check
checkProducts();
