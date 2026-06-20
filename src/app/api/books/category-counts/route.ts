import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Fetch all books with category + total_copies using admin client (bypasses RLS)
    let allBooks: { category: string; total_copies: number }[] = [];
    let page = 0;

    while (true) {
      const { data, error } = await supabaseAdmin
        .from('books')
        .select('category, total_copies')
        .range(page * 1000, (page + 1) * 1000 - 1);

      if (error) throw error;
      if (!data || data.length === 0) break;

      allBooks = [...allBooks, ...data];
      if (data.length < 1000) break;
      page++;
    }

    const categoryCounts: Record<string, number> = {};
    let totalCopies = 0;

    allBooks.forEach((book) => {
      const cat = book.category;
      const copies = book.total_copies || 1;
      categoryCounts[cat] = (categoryCounts[cat] || 0) + copies;
      totalCopies += copies;
    });

    return NextResponse.json({
      counts: categoryCounts,
      totalBooks: totalCopies,
      totalDepts: Object.keys(categoryCounts).length,
    });
  } catch (err) {
    console.error('Error fetching category counts:', err);
    return NextResponse.json({ error: 'Failed to fetch counts' }, { status: 500 });
  }
}
