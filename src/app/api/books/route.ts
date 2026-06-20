import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

export const dynamic = 'force-static'; // cacheable static JSON

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'books.json');
    const data = await fs.readFile(filePath, 'utf-8');
    const books = JSON.parse(data);
    return NextResponse.json(books);
  } catch (err) {
    console.error('Failed to read books.json', err);
    return NextResponse.json({ error: 'Unable to load books data' }, { status: 500 });
  }
}
