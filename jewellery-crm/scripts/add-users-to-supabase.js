const { createClient } = require('@supabase/supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wwyespebfotedtbphttp.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // You'll need to add this to your .env

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in environment variables');
  console.log('Please add SUPABASE_SERVICE_ROLE_KEY to your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// User data with proper role mappings
const users = [
  // 👑 Admin (1 user)
  {
    email: 'admin.divesh@sarkarjewellers.com',
    password: 'Divyesh@Sarkar1234',
    first_name: 'Divesh',
    last_name: 'Sarkar',
    role: 'business_admin',
    employee_id: 'ADM001',
    floor: null, // Admin doesn't have a specific floor
    phone: null
  },
  
  // 🏪 Manager (1 user)
  {
    email: 'satellite.manager@sarkarjewellers.com',
    password: 'Manager123',
    first_name: 'Satellite',
    last_name: 'Manager',
    role: 'floor_manager',
    employee_id: 'MGR001',
    floor: 1, // Assuming Satellite Store is on floor 1
    phone: null
  },
  
  // 🧑‍💼 Salespeople (26 users)
  {
    email: 'chiragbhai@sarkarjewellers.com',
    password: 'Sales123',
    first_name: 'Chiragbhai',
    last_name: '',
    role: 'sales_associate',
    employee_id: 'SAT001',
    floor: 1,
    phone: null
  },
  {
    email: 'bhumiben@sarkarjewellers.com',
    password: 'Sales123',
    first_name: 'Bhumiben',
    last_name: '',
    role: 'sales_associate',
    employee_id: 'SAT002',
    floor: 1,
    phone: null
  },
  {
    email: 'meet@sarkarjewellers.com',
    password: 'Sales123',
    first_name: 'Meet',
    last_name: '',
    role: 'sales_associate',
    employee_id: 'SAT003',
    floor: 1,
    phone: null
  },
  {
    email: 'karina@sarkarjewellers.com',
    password: 'Sales123',
    first_name: 'Karina',
    last_name: '',
    role: 'sales_associate',
    employee_id: 'SAT004',
    floor: 1,
    phone: null
  },
  {
    email: 'manojbhai@sarkarjewellers.com',
    password: 'Sales123',
    first_name: 'Manojbhai',
    last_name: '',
    role: 'sales_associate',
    employee_id: 'SAT005',
    floor: 1,
    phone: null
  },
  {
    email: 'ashok@sarkarjewellers.com',
    password: 'Sales123',
    first_name: 'Ashok',
    last_name: '',
    role: 'sales_associate',
    employee_id: 'SAT006',
    floor: 2,
    phone: null
  },
  {
    email: 'chintan@sarkarjewellers.com',
    password: 'Sales123',
    first_name: 'Chintan',
    last_name: '',
    role: 'sales_associate',
    employee_id: 'SAT007',
    floor: 2,
    phone: null
  },
  {
    email: 'karan@sarkarjewellers.com',
    password: 'Sales123',
    first_name: 'Karan',
    last_name: '',
    role: 'sales_associate',
    employee_id: 'SAT008',
    floor: 2,
    phone: null
  },
  {
    email: 'nilja@sarkarjewellers.com',
    password: 'Sales123',
    first_name: 'Nilja',
    last_name: '',
    role: 'sales_associate',
    employee_id: 'SAT009',
    floor: 2,
    phone: null
  },
  {
    email: 'sonal.r@sarkarjewellers.com',
    password: 'Sales123',
    first_name: 'Sonal',
    last_name: 'R',
    role: 'sales_associate',
    employee_id: 'SAT010',
    floor: 2,
    phone: null
  },
  {
    email: 'shreya@sarkarjewellers.com',
    password: 'Sales123',
    first_name: 'Shreya',
    last_name: '',
    role: 'sales_associate',
    employee_id: 'SAT011',
    floor: 2,
    phone: null
  },
  {
    email: 'rushil@sarkarjewellers.com',
    password: 'Sales123',
    first_name: 'Rushil',
    last_name: '',
    role: 'sales_associate',
    employee_id: 'SAT012',
    floor: 2,
    phone: null
  },
  {
    email: 'mittal@sarkarjewellers.com',
    password: 'Sales123',
    first_name: 'Mittal',
    last_name: '',
    role: 'sales_associate',
    employee_id: 'SAT013',
    floor: 2,
    phone: null
  },
  {
    email: 'upendrakaka@sarkarjewellers.com',
    password: 'Sales123',
    first_name: 'Upendrakaka',
    last_name: '',
    role: 'sales_associate',
    employee_id: 'SAT014',
    floor: 3,
    phone: null
  },
  {
    email: 'kundan@sarkarjewellers.com',
    password: 'Sales123',
    first_name: 'Kundan',
    last_name: '',
    role: 'sales_associate',
    employee_id: 'SAT015',
    floor: 3,
    phone: null
  },
  {
    email: 'sonal.p@sarkarjewellers.com',
    password: 'Sales123',
    first_name: 'Sonal',
    last_name: 'P',
    role: 'sales_associate',
    employee_id: 'SAT016',
    floor: 3,
    phone: null
  },
  {
    email: 'pragnyaben@sarkarjewellers.com',
    password: 'Sales123',
    first_name: 'Pragnyaben',
    last_name: '',
    role: 'sales_associate',
    employee_id: 'SAT017',
    floor: 3,
    phone: null
  },
  {
    email: 'amitkaka@sarkarjewellers.com',
    password: 'Sales123',
    first_name: 'Amitkaka',
    last_name: '',
    role: 'sales_associate',
    employee_id: 'SAT018',
    floor: 3,
    phone: null
  },
  {
    email: 'umeshkaka@sarkarjewellers.com',
    password: 'Sales123',
    first_name: 'Umeshkaka',
    last_name: '',
    role: 'sales_associate',
    employee_id: 'SAT019',
    floor: 3,
    phone: null
  },
  {
    email: 'amiben@sarkarjewellers.com',
    password: 'Sales123',
    first_name: 'Amiben',
    last_name: '',
    role: 'sales_associate',
    employee_id: 'SAT020',
    floor: 3,
    phone: null
  },
  {
    email: 'ishwarbhai@sarkarjewellers.com',
    password: 'Sales123',
    first_name: 'Ishwarbhai',
    last_name: '',
    role: 'sales_associate',
    employee_id: 'SAT021',
    floor: 3,
    phone: null
  },
  {
    email: 'jigneshbhai@sarkarjewellers.com',
    password: 'Sales123',
    first_name: 'Jigneshbhai',
    last_name: '',
    role: 'sales_associate',
    employee_id: 'SAT022',
    floor: 3,
    phone: null
  },
  {
    email: 'charmi@sarkarjewellers.com',
    password: 'Sales123',
    first_name: 'Charmi',
    last_name: '',
    role: 'sales_associate',
    employee_id: 'SAT023',
    floor: 3,
    phone: null
  },
  {
    email: 'pareshbhai@sarkarjewellers.com',
    password: 'Sales123',
    first_name: 'Pareshbhai',
    last_name: '',
    role: 'sales_associate',
    employee_id: 'SAT024',
    floor: 3,
    phone: null
  },
  {
    email: 'pratik@sarkarjewellers.com',
    password: 'Sales123',
    first_name: 'Pratik',
    last_name: '',
    role: 'sales_associate',
    employee_id: 'SAT025',
    floor: 3,
    phone: null
  },
  {
    email: 'nikitaben@sarkarjewellers.com',
    password: 'Sales123',
    first_name: 'Nikitaben',
    last_name: '',
    role: 'sales_associate',
    employee_id: 'SAT026',
    floor: 3,
    phone: null
  }
];

async function addUsers() {
  console.log('🚀 Starting user creation process...');
  console.log(`📊 Total users to create: ${users.length}`);
  
  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (const user of users) {
    try {
      console.log(`\n👤 Creating user: ${user.email}`);
      
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          employee_id: user.employee_id,
          floor: user.floor
        }
      });

      if (authError) {
        throw new Error(`Auth creation failed: ${authError.message}`);
      }

      // Add user to team_members table
      const { error: profileError } = await supabase
        .from('team_members')
        .insert({
          id: authData.user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          floor: user.floor,
          phone: user.phone,
          status: 'active'
        });

      if (profileError) {
        throw new Error(`Profile creation failed: ${profileError.message}`);
      }

      console.log(`✅ Successfully created: ${user.email} (${user.role})`);
      successCount++;

    } catch (error) {
      console.error(`❌ Failed to create user ${user.email}:`, error.message);
      errors.push({ email: user.email, error: error.message });
      errorCount++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📋 USER CREATION SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Successfully created: ${successCount} users`);
  console.log(`❌ Failed to create: ${errorCount} users`);
  
  if (errors.length > 0) {
    console.log('\n❌ ERRORS:');
    errors.forEach(({ email, error }) => {
      console.log(`  - ${email}: ${error}`);
    });
  }

  if (successCount > 0) {
    console.log('\n🎉 Users have been successfully added to your Supabase database!');
    console.log('Users can now log in with their email and password.');
  }
}

// Run the script
addUsers().catch(console.error);
