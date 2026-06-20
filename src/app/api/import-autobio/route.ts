import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'test', 'motivation.json');
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const jsonData = JSON.parse(rawData);
    
    const categoryName = jsonData.Category;
    const booksList = jsonData.Books;

    const validBooks = booksList
      .filter((b: any) => b['Book Name'] && b['Book Name'].trim() !== '')
      .map((b: any) => ({
        title: b['Book Name'].trim(),
        author: b['Author'] ? b['Author'].trim() : 'Unknown',
        category: categoryName,
        status: 'Available',
        total_copies: 1
      }));

    // Remove duplicates based on title (case-insensitive)
    const uniqueMap = new Map();
    validBooks.forEach((book: any) => {
      uniqueMap.set(book.title.toLowerCase(), book);
    });
    
    const booksToInsert = Array.from(uniqueMap.values());

    // Before inserting, check what's already in the DB to avoid DB duplicates
    const { data: existingBooks, error: fetchError } = await supabaseAdmin
      .from('books')
      .select('title')
      .eq('category', categoryName);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const existingTitles = new Set((existingBooks || []).map((b: any) => b.title.toLowerCase()));

    const finalBooks = booksToInsert.filter((book: any) => !existingTitles.has(book.title.toLowerCase()));

    if (finalBooks.length === 0) {
      return NextResponse.json({ message: 'No new unique books to insert.' });
    }

    const { error: insertError } = await supabaseAdmin.from('books').insert(finalBooks);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      message: `Successfully inserted ${finalBooks.length} books. Ignored ${booksToInsert.length - finalBooks.length} duplicates.` 
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
