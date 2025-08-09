const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wwyespebfotedtbphttp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3eWVzcGViZm90ZWR0YnBodHRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MjY1MjksImV4cCI6MjA3MDIwMjUyOX0.g6AM1DR4A-qE8uS054qhL5BktnUxJ3MdXH7SCmn6S3M';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRelationships() {
  console.log('Testing database relationships...');
  
  try {
    // Test the fixed customer relationship query
    console.log('\n1. Testing customers with team_members relationship:');
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select(`
        *,
        team_members!assigned_to(first_name, last_name)
      `)
      .limit(5);
    
    if (customerError) {
      console.log('❌ Customer query error:', customerError);
    } else {
      console.log('✅ Customer query successful');
      console.log(`Found ${customers.length} customers`);
      if (customers.length > 0) {
        console.log('Sample customer:', {
          id: customers[0].id,
          name: customers[0].name,
          floor: customers[0].floor,
          team_member: customers[0].team_members
        });
      }
    }

    // Test floor filtering
    console.log('\n2. Testing floor 1 customers:');
    const { data: floor1Customers, error: floor1Error } = await supabase
      .from('customers')
      .select(`
        *,
        team_members!assigned_to(first_name, last_name)
      `)
      .eq('floor', 1)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (floor1Error) {
      console.log('❌ Floor 1 query error:', floor1Error);
    } else {
      console.log('✅ Floor 1 query successful');
      console.log(`Found ${floor1Customers.length} customers on floor 1`);
    }

    // Test team_members table
    console.log('\n3. Testing team_members table:');
    const { data: teamMembers, error: teamError } = await supabase
      .from('team_members')
      .select('*')
      .limit(5);
    
    if (teamError) {
      console.log('❌ Team members query error:', teamError);
    } else {
      console.log('✅ Team members query successful');
      console.log(`Found ${teamMembers.length} team members`);
      if (teamMembers.length > 0) {
        console.log('Sample team member:', {
          id: teamMembers[0].id,
          name: `${teamMembers[0].first_name} ${teamMembers[0].last_name}`,
          role: teamMembers[0].role,
          floor: teamMembers[0].floor
        });
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testRelationships();
