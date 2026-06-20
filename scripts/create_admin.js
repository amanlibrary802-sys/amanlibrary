require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function setupAdmin() {
  console.log('Checking admin user...');
  
  let userId;
  
  // Try to create the user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: 'admin@aman.edu',
    password: 'admin123',
    email_confirm: true,
  });

  if (authError) {
    if (authError.message.includes('already exists') || authError.status === 422) {
      console.log('User already exists in Auth. Fetching user and updating password...');
      const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (listError) {
        console.error('Error listing users:', listError);
        return;
      }
      
      const adminUser = usersData.users.find(u => u.email === 'admin@aman.edu');
      if (adminUser) {
        userId = adminUser.id;
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: 'admin123' });
        if (updateError) {
          console.error('Error updating password:', updateError);
          return;
        }
        console.log('Password updated to admin123.');
      } else {
        console.log('Admin user not found in list, weird.');
        return;
      }
    } else {
      console.error('Auth Error:', authError);
      return;
    }
  } else {
    userId = authData.user.id;
    console.log('Auth user created successfully.');
  }

  // Ensure record in students table
  if (userId) {
    console.log(`Upserting admin record in students table for user ID: ${userId}...`);
    const { error: dbError } = await supabaseAdmin.from('students').upsert({
      id: userId,
      name: 'System Admin',
      role: 'admin',
    });
    
    if (dbError) {
      console.error('DB Error:', dbError);
    } else {
      console.log('Admin database setup complete! You should now be able to login.');
    }
  }
}

setupAdmin();
