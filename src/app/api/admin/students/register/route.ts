import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const supabase = createClient();
  
  // 1. Check if the requester is an admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('students')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  // 2. Get registration data
  const { name, mobile, batch } = await req.json();

  if (!name || !mobile || !batch) {
    return NextResponse.json({ error: 'Name, mobile number, and batch are required' }, { status: 400 });
  }

  // Normalize phone: strip non-digits
  // If the batch is JD-1, JD-2, or JD-3, force the mobile number to 0000000000
  let cleanPhone = mobile.replace(/\D/g, '');
  if (['JD-1', 'JD-2', 'JD-3'].includes(batch.trim().toUpperCase())) {
    cleanPhone = '0000000000';
  }

  if (cleanPhone.length < 7) {
    return NextResponse.json({ error: 'Invalid mobile number' }, { status: 400 });
  }

  // Check if student with this phone already exists (only if not the default 0000000000)
  if (cleanPhone !== '0000000000') {
    const { data: existing } = await supabaseAdmin
      .from('students')
      .select('id')
      .eq('whatsapp_number', cleanPhone)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'A student with this mobile number already exists' }, { status: 409 });
    }
  }

  // 3. Auto-generate synthetic email and password from phone number
  //    Students never see or use these — login is by name + phone
  //    If the phone is the default '0000000000', append a unique timestamp to avoid Auth conflicts
  const uniqueId = cleanPhone === '0000000000' ? `_${Date.now()}_${Math.floor(Math.random() * 1000)}` : '';
  const syntheticEmail = `${cleanPhone}${uniqueId}@students.aman.local`;
  const syntheticPassword = `aman_${cleanPhone}_secure`;

  // 4. Create user in Supabase Auth
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: syntheticEmail,
    password: syntheticPassword,
    email_confirm: true
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  // 5. Create profile in public.students
  const { error: profileError } = await supabaseAdmin
    .from('students')
    .insert([{
      id: authUser.user.id,
      name: name.trim(),
      whatsapp_number: cleanPhone,
      batch: batch.trim(),
      role: 'student'
    }]);

  if (profileError) {
    // Cleanup auth user if profile creation fails
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, userId: authUser.user.id });
}
