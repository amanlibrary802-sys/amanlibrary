import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('books')
    .select('*')
    .eq('category', 'SYSTEM_EVENT')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const events = data.map(book => ({
    id: book.book_id,
    title: book.title,
    date: book.shelf_loc.split('||')[0],
    time: book.shelf_loc.split('||')[1],
    description: book.author,
    completed: book.status === 'Lost'
  }));

  return NextResponse.json(events);
}

export async function POST(req: Request) {
  const event = await req.json();
  const book_id = event.id || crypto.randomUUID();
  
  const { data, error } = await supabaseAdmin
    .from('books')
    .upsert({
      book_id,
      title: event.title,
      author: event.description || ' ',
      category: 'SYSTEM_EVENT',
      shelf_loc: `${event.date}||${event.time}`,
      status: event.completed ? 'Lost' : 'Available',
      total_copies: 0
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, event });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

  const { error } = await supabaseAdmin
    .from('books')
    .delete()
    .eq('book_id', id)
    .eq('category', 'SYSTEM_EVENT');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
