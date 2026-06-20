import { NextResponse } from 'next/server';
import { sendWhatsAppReminder } from '@/lib/twilio';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Check admin role
    const { data: profile } = await supabase
      .from('students')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { phone, studentName, bookTitle } = await req.json();

    if (!phone || !studentName || !bookTitle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const success = await sendWhatsAppReminder(phone, studentName, bookTitle);

    if (!success) {
      return NextResponse.json({ error: 'Twilio failed to send message' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
