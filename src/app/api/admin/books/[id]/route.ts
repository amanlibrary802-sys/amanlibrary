import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
);

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    
    // First, verify the book exists
    const { data: book, error: fetchError } = await supabaseAdmin
      .from('books')
      .select('book_id')
      .eq('book_id', id)
      .single();

    if (fetchError || !book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // To safely delete a book that has history, we must first delete its associated transactions
    const { error: txError } = await supabaseAdmin
      .from('transactions')
      .delete()
      .eq('book_id', id);

    if (txError) {
      return NextResponse.json({ error: 'Failed to purge associated transactions: ' + txError.message }, { status: 400 });
    }

    // Now safely delete the book
    const { error: deleteError } = await supabaseAdmin
      .from('books')
      .delete()
      .eq('book_id', id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();

    const { error: updateError } = await supabaseAdmin
      .from('books')
      .update(body)
      .eq('book_id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
