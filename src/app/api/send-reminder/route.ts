import { NextResponse } from 'next/server';
import { sendWhatsAppReminder } from '@/lib/twilio';

export async function POST(req: Request) {
  try {
    const { phone, bookName, studentName } = await req.json();

    const success = await sendWhatsAppReminder(phone, studentName, bookName);

    if (!success) {
      return NextResponse.json({ error: 'Failed to send WhatsApp message' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
