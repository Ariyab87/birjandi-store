import { NextRequest, NextResponse } from 'next/server';
import { sendOrderEmails } from '@/lib/email';
import { generateOrderId } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, customer, items, total } = body;

    if (!customer?.name || !customer?.phone || !customer?.address || !items?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const orderId = generateOrderId();

    await sendOrderEmails({ type, customer, items, total, orderId });

    return NextResponse.json({ success: true, orderId });
  } catch (err) {
    console.error('Order error:', err);
    return NextResponse.json({ error: 'Failed to process order' }, { status: 500 });
  }
}
