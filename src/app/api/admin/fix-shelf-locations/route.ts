import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const CATEGORY_PREFIX: Record<string, string> = {
  'Religion':               'R',
  'Study':                  'S',
  'Literature':             'L',
  'Motivation & Psychology':'M',
  'History':                'H',
  'Autobiography':          'A',
  'Science':                'Sc',
  'Language':               'La',
  'Dictionary':             'D',
  'Kithabs':                'K',
};

// Matches shelf_loc values that are purely numeric (e.g. "100", "38") — no leading letters
const isNumericOnly = (loc: string) => /^\d+$/.test(loc.trim());

export async function GET() {
  try {
    // Fetch all books
    const { data: books, error: fetchErr } = await supabaseAdmin
      .from('books')
      .select('book_id, category, shelf_loc');

    if (fetchErr) throw fetchErr;

    const toUpdate = (books || []).filter(
      (b) => b.shelf_loc && isNumericOnly(b.shelf_loc)
    );

    let updatedCount = 0;
    const errors: string[] = [];

    for (const book of toUpdate) {
      const prefix = CATEGORY_PREFIX[book.category] ?? book.category[0].toUpperCase();
      const newLoc = `${prefix}${book.shelf_loc.trim()}`;

      const { error } = await supabaseAdmin
        .from('books')
        .update({ shelf_loc: newLoc })
        .eq('book_id', book.book_id);

      if (error) {
        errors.push(`${book.book_id}: ${error.message}`);
      } else {
        updatedCount++;
      }
    }

    return NextResponse.json({
      message: `Updated ${updatedCount} of ${toUpdate.length} books.`,
      skipped: (books?.length ?? 0) - toUpdate.length,
      errors: errors.length ? errors : undefined,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
