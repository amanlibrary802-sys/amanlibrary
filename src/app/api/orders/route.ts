import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { bookId } = await req.json();

  // Check book status
  const { data: book, error: bookError } = await supabase
    .from('books')
    .select('status')
    .eq('book_id', bookId)
    .single();

  if (bookError || book.status !== 'Available') {
    return NextResponse.json({ error: 'Book is not available' }, { status: 400 });
  }

  // Insert transaction
  const { error: txError } = await supabase
    .from('transactions')
    .insert([{
      student_id: user.id,
      book_id: bookId,
      status: 'Reserved',
      order_date: new Date().toISOString().split('T')[0]
    }]);

  if (txError) {
    return NextResponse.json({ error: txError.message }, { status: 500 });
  }

  // Update book status
  await supabase
    .from('books')
    .update({ status: 'Ordered' })
    .eq('book_id', bookId);

  return NextResponse.json({ success: true });
}
