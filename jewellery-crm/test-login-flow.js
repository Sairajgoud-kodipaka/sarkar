const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wwyespebfotedtbphttp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3eWVzcGViZm90ZWR0YnBodHRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MjY1MjksImV4cCI6MjA3MDIwMjUyOX0.g6AM1DR4A-qE8uS054qhL5BktnUxJ3MdXH7SCmn6S3M';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLoginFlow() {
  console.log('Testing login flow...');
  
  const testEmail = 'business.admin@test.com';
  const testPassword = 'password123';
  
  try {
    // Try to sign up a test user
    console.log('Attempting to create test user...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          first_name: 'Business',
          last_name: 'Admin',
          role: 'business_admin'
        }
      }
    });
    
    if (signUpError) {
      console.log('Sign up error (might already exist):', signUpError.message);
    } else {
      console.log('User created successfully');
    }
    
    // Try to sign in
    console.log('Attempting to sign in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (signInError) {
      console.log('Sign in error:', signInError.message);
    } else {
      console.log('Sign in successful!');
      console.log('User ID:', signInData.user.id);
      console.log('User email:', signInData.user.email);
      console.log('User metadata:', signInData.user.user_metadata);
      
      // Test accessing data
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('count')
        .limit(1);
      
      console.log('Customers query result:', customers ? 'Success' : 'Failed');
      if (customersError) console.log('Customers error:', customersError);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testLoginFlow();
