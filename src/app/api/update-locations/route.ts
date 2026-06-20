import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const testDir = path.join(process.cwd(), 'test');
    const files = ['autobiography.json', 'literature.json', 'motivation.json', 'study.json'];
    
    let updatedCount = 0;
    
    for (const file of files) {
      const filePath = path.join(testDir, file);
      if (fs.existsSync(filePath)) {
        const rawData = fs.readFileSync(filePath, 'utf-8');
        const jsonData = JSON.parse(rawData);
        const booksList = jsonData.Books;

        for (const book of booksList) {
          if (book['Book Name'] && book['No']) {
            const title = book['Book Name'].trim();
            const location = book['No'].toString();

            const { error } = await supabaseAdmin
              .from('books')
              .update({ shelf_loc: location })
              .eq('title', title);
            
            if (!error) updatedCount++;
          }
        }
      }
    }

    return NextResponse.json({ message: `Successfully updated ${updatedCount} book locations from JSON files.` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
