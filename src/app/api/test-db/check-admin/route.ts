import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { data: students } = await supabaseAdmin.from('students').select('*').eq('name', 'admin-1').single();
  if (!students) return NextResponse.json({ error: 'not found' });

  const { data: authUser, error } = await supabaseAdmin.auth.admin.getUserById(students.id);
  
  return NextResponse.json({ student: students, authUser: authUser, error });
}
