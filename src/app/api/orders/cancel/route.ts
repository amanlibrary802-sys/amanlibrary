import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { bookId } = await req.json();

  if (!bookId) {
    return NextResponse.json({ error: 'Book ID is required' }, { status: 400 });
  }

  // Find the pending transaction for this user and book
  const { data: tx, error: txFetchError } = await supabase
    .from('transactions')
    .select('*')
    .eq('student_id', user.id)
    .eq('book_id', bookId)
    .eq('status', 'Reserved')
    .single();

  if (txFetchError || !tx) {
    return NextResponse.json(
      { error: 'Order not found or it has already been processed by admin' },
      { status: 404 }
    );
  }

  // Delete the pending transaction
  const { error: txDeleteError } = await supabase
    .from('transactions')
    .delete()
    .eq('transaction_id', tx.transaction_id);

  if (txDeleteError) {
    return NextResponse.json({ error: txDeleteError.message }, { status: 500 });
  }

  // Update book status back to 'Available'
  await supabase
    .from('books')
    .update({ status: 'Available' })
    .eq('book_id', bookId);

  return NextResponse.json({ success: true });
}
