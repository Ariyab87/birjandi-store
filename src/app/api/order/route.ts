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

// Abuse guard: every order sends an email (Resend quota + sender reputation)
// and writes a Strapi row, so an unthrottled endpoint is a spam amplifier.
// A real customer places at most a couple of orders a day.
const RATE = { perMinute: 3, perDay: 15 };
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const day = (hits.get(ip) || []).filter(t => now - t < 24 * 60 * 60 * 1000);
  const minute = day.filter(t => now - t < 60_000);
  if (minute.length >= RATE.perMinute || day.length >= RATE.perDay) {
    hits.set(ip, day);
    return true;
  }
  day.push(now);
  hits.set(ip, day);
  if (hits.size > 5000) hits.clear();
  return false;
}

/** Trim and cap a free-text field so oversized payloads can't bloat emails/DB. */
const cap = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (rateLimited(ip)) {
      return NextResponse.json(
        { error: 'تعداد سفارش‌های ثبت‌شده از این آدرس زیاد است. لطفاً کمی بعد دوباره تلاش کنید یا از طریق واتساپ سفارش دهید.' },
        { status: 429 },
      );
    }

    const body = await req.json();
    const { type, items, total } = body;
    const raw = body.customer ?? {};

    if (!raw.name || !raw.phone || !raw.address || !items?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length > 100) {
      return NextResponse.json({ error: 'Invalid items' }, { status: 400 });
    }

    // Cap every free-text field — the values land in an email and the database.
    const customer = {
      name: cap(raw.name, 100),
      phone: cap(raw.phone, 30),
      address: cap(raw.address, 500),
      ...(raw.email ? { email: cap(raw.email, 150) } : {}),
      ...(raw.businessName ? { businessName: cap(raw.businessName, 150) } : {}),
      ...(raw.notes ? { notes: cap(raw.notes, 1000) } : {}),
    };

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
