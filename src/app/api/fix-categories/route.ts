import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Fix LITERATURE -> Literature
    const { data: litBooks, error: litError } = await supabaseAdmin
      .from('books')
      .update({ category: 'Literature' })
      .eq('category', 'LITERATURE')
      .select();

    if (litError) {
      console.error('Error updating LITERATURE:', litError);
    }

    // 2. Fix MOTIVATION & PSYCHOLOGY -> Motivation & Psychology
    const { data: motBooks, error: motError } = await supabaseAdmin
      .from('books')
      .update({ category: 'Motivation & Psychology' })
      .eq('category', 'MOTIVATION & PSYCHOLOGY')
      .select();

    if (motError) {
      console.error('Error updating MOTIVATION:', motError);
    }

    // 3. Fix Auto and Biography -> Autobiography (if any)
    const { data: autoBooks, error: autoError } = await supabaseAdmin
      .from('books')
      .update({ category: 'Autobiography' })
      .eq('category', 'Auto and Biography')
      .select();
      
    // 4. Any other potential casing issues (e.g. SCIENCE -> Science)
    const { data: sciBooks, error: sciError } = await supabaseAdmin
      .from('books')
      .update({ category: 'Science' })
      .eq('category', 'SCIENCE')
      .select();

    return NextResponse.json({ 
      message: 'Categories normalized successfully!',
      updatedLiterature: litBooks?.length || 0,
      updatedMotivation: motBooks?.length || 0,
      updatedAuto: autoBooks?.length || 0,
      updatedScience: sciBooks?.length || 0
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
