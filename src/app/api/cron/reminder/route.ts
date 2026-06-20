import { createClient } from '@supabase/supabase-js';
import { sendWhatsAppReminder } from '@/lib/twilio';
import { NextResponse } from 'next/server';

// Service role client for CRON (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
);

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  // Protect with secret header
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const today = new Date();
    const fourteenDaysAgo = new Date(today.setDate(today.getDate() - 14)).toISOString().split('T')[0];

    const { data: transactions, error } = await supabaseAdmin
      .from('transactions')
      .select('*, students(*), books(*)')
      .eq('status', 'Issued')
      .eq('reminder_sent', false)
      .lte('issue_date', fourteenDaysAgo);

    if (error) throw error;

    const results = await Promise.all(
      (transactions || []).map(async (tx) => {
        const sent = await sendWhatsAppReminder(
          tx.students.whatsapp_number,
          tx.students.name,
          tx.books.title
        );

        if (sent) {
          await supabaseAdmin
            .from('transactions')
            .update({ reminder_sent: true })
            .eq('transaction_id', tx.transaction_id);
        }
        return { txId: tx.transaction_id, sent };
      })
    );

    return NextResponse.json({ success: true, processed: results.length, results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
