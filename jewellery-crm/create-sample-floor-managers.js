// Script to create sample floor managers for testing
const { createClient } = require('@supabase/supabase-js');

// Get these from your Supabase project settings
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SUPABASE_SERVICE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const sampleFloorManagers = [
  {
    email: 'floor1@sarkarcrm.com',
    first_name: 'John',
    last_name: 'Smith',
    role: 'floor_manager',
    floor: 1,
    phone: '+91 9876543211',
    status: 'active'
  },
  {
    email: 'floor2@sarkarcrm.com',
    first_name: 'Sarah',
    last_name: 'Johnson',
    role: 'floor_manager',
    floor: 2,
    phone: '+91 9876543212',
    status: 'active'
  },
  {
    email: 'floor3@sarkarcrm.com',
    first_name: 'Mike',
    last_name: 'Davis',
    role: 'floor_manager',
    floor: 3,
    phone: '+91 9876543213',
    status: 'active'
  }
];

async function createFloorManagers() {
  console.log('Creating sample floor managers...');
  
  for (const manager of sampleFloorManagers) {
    try {
      // First create the Supabase Auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: manager.email,
        password: 'floor123', // Default password
        email_confirm: true,
        user_metadata: {
          role: manager.role,
          first_name: manager.first_name,
          last_name: manager.last_name,
          floor: manager.floor
        }
      });

      if (authError) {
        console.error(`Error creating auth user ${manager.email}:`, authError.message);
        continue;
      }

      // Then create the team member record
      const { data, error } = await supabase
        .from('team_members')
        .insert({
          ...manager,
          id: authData.user.id // Use the auth user ID
        })
        .select()
        .single();
      
      if (error) {
        console.error(`Error creating team member ${manager.email}:`, error.message);
      } else {
        console.log(`✅ Created floor manager: ${manager.first_name} ${manager.last_name} (Floor ${manager.floor})`);
        console.log(`   Email: ${manager.email}, Password: floor123`);
      }
    } catch (err) {
      console.error(`Error creating floor manager ${manager.email}:`, err.message);
    }
  }
  
  console.log('Sample floor managers creation completed.');
}

// Also create some sample visits and sales data for testing
async function createSampleData() {
  console.log('Creating sample visits and sales data...');
  
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  // Sample visits
  const sampleVisits = [
    { customer_id: 1, customer_name: 'Priya Sharma', floor: 1, date: today, interest: 'Gold Necklace' },
    { customer_id: 2, customer_name: 'Rajesh Kumar', floor: 1, date: today, interest: 'Diamond Ring' },
    { customer_id: 3, customer_name: 'Anita Patel', floor: 2, date: today, interest: 'Silver Earrings' },
    { customer_id: 4, customer_name: 'Suresh Gupta', floor: 2, date: yesterday, interest: 'Gold Bangles' },
    { customer_id: 5, customer_name: 'Meera Shah', floor: 3, date: today, interest: 'Platinum Chain' }
  ];
  
  // Sample sales
  const sampleSales = [
    { customer_id: 1, customer_name: 'Priya Sharma', amount: 75000, date: today, floor: 1 },
    { customer_id: 2, customer_name: 'Rajesh Kumar', amount: 150000, date: today, floor: 1 },
    { customer_id: 3, customer_name: 'Anita Patel', amount: 25000, date: yesterday, floor: 2 },
    { customer_id: 4, customer_name: 'Suresh Gupta', amount: 45000, date: today, floor: 2 }
  ];
  
  // Insert visits
  const { error: visitsError } = await supabase
    .from('visits')
    .insert(sampleVisits);
  
  if (visitsError) {
    console.error('Error inserting visits:', visitsError.message);
  } else {
    console.log('✅ Created sample visits');
  }
  
  // Insert sales
  const { error: salesError } = await supabase
    .from('sales')
    .insert(sampleSales);
  
  if (salesError) {
    console.error('Error inserting sales:', salesError.message);
  } else {
    console.log('✅ Created sample sales');
  }
}

async function main() {
  await createFloorManagers();
  await createSampleData();
  console.log('\n✅ Setup complete! You can now test the floor manager dashboard.');
  console.log('\nTo test:');
  console.log('1. Log in as a floor manager using one of these emails:');
  console.log('   - floor1@sarkarcrm.com');
  console.log('   - floor2@sarkarcrm.com');
  console.log('   - floor3@sarkarcrm.com');
  console.log('2. Navigate to /floor-manager/dashboard');
  console.log('3. You should see real data instead of mock data');
}

main().catch(console.error);
