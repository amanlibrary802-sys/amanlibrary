
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

async function deleteUsers() {
  console.log('Fetching students to delete...');
  
  const { data: students, error: fetchError } = await supabaseAdmin
    .from('students')
    .select('*')
    .in('name', ['Nashid', 'Shafeed', 'nashid', 'shafeed', 'Shafeed ', 'Nashid ']);

  if (fetchError) {
    console.error('Error fetching students:', fetchError);
    return;
  }

  if (students.length === 0) {
    console.log('No students found with those names.');
    return;
  }

  console.log(`Found ${students.length} students to delete.`);

  for (const student of students) {
    console.log(`Deleting student: ${student.name} (ID: ${student.id})`);
    
    const { error: deleteDbError } = await supabaseAdmin
      .from('students')
      .delete()
      .eq('id', student.id);
      
    if (deleteDbError) {
      console.error(`Error deleting ${student.name} from DB:`, deleteDbError);
    } else {
      console.log(`Deleted ${student.name} from DB.`);
    }

    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(student.id);
    if (deleteAuthError) {
      console.log(`Note: Auth user deletion failed:`, deleteAuthError.message);
    } else {
      console.log(`Deleted ${student.name} from Auth.`);
    }
  }
}

deleteUsers();
