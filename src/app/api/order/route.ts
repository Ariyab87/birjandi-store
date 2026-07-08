import { NextRequest, NextResponse } from 'next/server';
import { sendOrderEmails } from '@/lib/email';
import { generateOrderId } from '@/lib/utils';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN || '';

// Persist the order to Strapi for later accounting review. Never blocks/fails the order.
async function saveOrderToStrapi(order: {
  type: string;
  customer: { name: string; phone: string; address: string; businessName?: string; email?: string; notes?: string };
  items: unknown[];
  total: number;
  orderId: string;
}) {
  try {
    const res = await fetch(`${STRAPI_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {}),
      },
      body: JSON.stringify({
        data: {
          order_id: order.orderId,
          type: order.type,
          customer_name: order.customer.name,
          customer_phone: order.customer.phone,
          customer_address: order.customer.address,
          customer_email: order.customer.email || null,
          business_name: order.customer.businessName || null,
          notes: order.customer.notes || null,
          items: order.items,
          total: order.total,
          status: 'new',
        },
      }),
    });
    if (!res.ok) {
      console.error('Strapi order save failed:', res.status, await res.text());
    }
  } catch (err) {
    console.error('Strapi order save error:', err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, customer, items, total } = body;

    if (!customer?.name || !customer?.phone || !customer?.address || !items?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const orderId = generateOrderId();

    // Save to Strapi first (for accounting) so the record survives even if email fails.
    await saveOrderToStrapi({ type, customer, items, total, orderId });

    await sendOrderEmails({ type, customer, items, total, orderId });

    return NextResponse.json({ success: true, orderId });
  } catch (err) {
    console.error('Order error:', err);
    return NextResponse.json({ error: 'Failed to process order' }, { status: 500 });
  }
}
