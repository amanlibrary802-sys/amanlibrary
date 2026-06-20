import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { sendOrderConfirmation } from '@/lib/twilio';

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
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

  const { bookId } = await req.json();
  const today = new Date();
  const issueDate = today.toISOString().split('T')[0];
  const deadline = new Date(today.setDate(today.getDate() + 21)).toISOString().split('T')[0];

  // Fetch transaction details for notification
  const { data: txData } = await supabaseAdmin
    .from('transactions')
    .select('*, students(*), books(*)')
    .eq('transaction_id', params.id)
    .single();

  // Update transaction using supabaseAdmin to bypass RLS
  const { error: txError } = await supabaseAdmin
    .from('transactions')
    .update({
      status: 'Issued',
      issue_date: issueDate,
      return_deadline: deadline
    })
    .eq('transaction_id', params.id);

  if (txError) return NextResponse.json({ error: txError.message }, { status: 500 });

  // Update book using supabaseAdmin to bypass RLS
  await supabaseAdmin
    .from('books')
    .update({ status: 'Issued' })
    .eq('book_id', bookId);

  // Send WhatsApp notification
  if (txData?.students?.whatsapp_number) {
    await sendOrderConfirmation(
      txData.students.whatsapp_number,
      txData.students.name,
      txData.books.title,
      deadline
    );
  }

  return NextResponse.json({ success: true, deadline });
}
