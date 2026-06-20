import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: admins, error: dbError } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('role', 'admin');

    if (dbError) {
      return NextResponse.json({ error: 'DB Error', details: dbError }, { status: 200 });
    }

    // Now let's try to fetch the admin's email
    if (admins && admins.length > 0) {
      const adminId = admins[0].id;
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(adminId);
      
      if (userError) {
        return NextResponse.json({ error: 'Auth Fetch Error', details: userError }, { status: 200 });
      }
      return NextResponse.json({ success: true, adminName: admins[0].name, email: userData.user.email }, { status: 200 });
    }

    return NextResponse.json({ success: false, message: 'No admins found in students table' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Unexpected error', details: error.message }, { status: 200 });
  }
}
