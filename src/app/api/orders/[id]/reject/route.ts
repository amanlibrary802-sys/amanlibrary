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

  // Delete the pending transaction
  const { error: txDeleteError } = await supabaseAdmin
    .from('transactions')
    .delete()
    .eq('transaction_id', params.id);

  if (txDeleteError) {
    return NextResponse.json({ error: txDeleteError.message }, { status: 500 });
  }

  // Update book using supabaseAdmin to bypass RLS
  await supabaseAdmin
    .from('books')
    .update({ status: 'Available' })
    .eq('book_id', bookId);

  return NextResponse.json({ success: true });
}
