import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { data } = await supabaseAdmin.from('books').select('*').limit(1);
  return NextResponse.json(data);
}
