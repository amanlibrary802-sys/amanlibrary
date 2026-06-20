import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('students')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { bookId } = await req.json();

  // Update transaction using supabaseAdmin to bypass RLS
  const { error: txError } = await supabaseAdmin
    .from('transactions')
    .update({
      status: 'Returned',
      returned_at: new Date().toISOString().split('T')[0]
    })
    .eq('transaction_id', params.id);

  if (txError) return NextResponse.json({ error: txError.message }, { status: 500 });

  // Update book using supabaseAdmin to bypass RLS
  await supabaseAdmin
    .from('books')
    .update({ status: 'Available' })
    .eq('book_id', bookId);

  return NextResponse.json({ success: true });
}
