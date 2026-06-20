import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { id, pw } = await req.json();

    if (!id || !pw) {
      return NextResponse.json({ error: 'ID and PW are required' }, { status: 400 });
    }

    // 1. Find the user by ID (name)
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('*')
      .ilike('name', id.trim())
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'Invalid ID or PW' },
        { status: 404 }
      );
    }

    // 2. Verify the PW matches whatsapp_number, password, or pin
    const cleanPwAsPhone = pw.replace(/\D/g, '');
    let isValidPw = false;

    // Special rule for JD batches: Password should be their name itself
    const isJdBatch = ['JD-1', 'JD-2', 'JD-3'].includes((student.batch || '').trim().toUpperCase());
    
    if (isJdBatch) {
      isValidPw = pw.trim().toLowerCase() === student.name.trim().toLowerCase();
    } else {
      isValidPw = 
        student.whatsapp_number === cleanPwAsPhone || 
        student.password === pw || 
        student.pin === pw;
    }

    if (!isValidPw) {
      return NextResponse.json(
        { error: 'Invalid ID or PW' },
        { status: 404 }
      );
    }

    // 3. Fetch their actual Supabase Auth email
    const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(student.id);

    if (authUserError || !authUser) {
      return NextResponse.json(
        { error: 'User auth record not found. Please contact administrator.' },
        { status: 404 }
      );
    }

    // 4. Force sync their Supabase Auth password to a structured synthetic password.
    // This resolves issues where the whatsapp_number or password was updated in the DB
    // but the underlying Supabase Auth password was never updated to match,
    // while ensuring it meets Supabase's minimum length requirements (6+ chars).
    const syntheticPassword = `aman_${pw}_secure`;
    await supabaseAdmin.auth.admin.updateUserById(student.id, {
      password: syntheticPassword
    });

    return NextResponse.json({
      email: authUser.user.email,
      password: syntheticPassword,
      studentId: student.id,
      name: student.name,
      role: student.role
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
