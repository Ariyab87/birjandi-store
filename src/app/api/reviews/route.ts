import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN || '';

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    ...(STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {}),
  };
}

// Reviews aren't publicly readable/writable in Strapi (no permissions granted) —
// everything goes through here so unapproved content never leaks and we control spam.

// GET /api/reviews?product=documentId — approved reviews only, newest first
export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get('product');
  if (!productId) return NextResponse.json({ error: 'product required' }, { status: 400 });

  try {
    const params = new URLSearchParams({
      'filters[product_document_id][$eq]': productId,
      'filters[approved][$eq]': 'true',
      'sort[0]': 'createdAt:desc',
      'pagination[limit]': '100',
    });
    const res = await fetch(`${STRAPI_URL}/api/reviews?${params}`, { headers: authHeaders(), next: { revalidate: 60 } });
    const json = await res.json();
    const reviews = (json.data || []) as Array<{ name: string; rating: number; comment: string; createdAt: string }>;
    const count = reviews.length;
    const average = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
    return NextResponse.json({ reviews, average, count });
  } catch (err) {
    console.error('Load reviews error:', err);
    return NextResponse.json({ reviews: [], average: 0, count: 0 });
  }
}

// Abuse guard: a real customer leaves at most one or two reviews a day.
const RATE = { perDay: 5 };
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const day = (hits.get(ip) || []).filter(t => now - t < 24 * 60 * 60 * 1000);
  if (day.length >= RATE.perDay) { hits.set(ip, day); return true; }
  day.push(now);
  hits.set(ip, day);
  if (hits.size > 5000) hits.clear();
  return false;
}

// POST /api/reviews — body: { productDocumentId, name, rating, comment }
// Always created unapproved; an admin must approve before it's shown publicly.
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (rateLimited(ip)) {
      return NextResponse.json({ error: 'تعداد نظرات ثبت‌شده امروز از این آدرس زیاد است. فردا دوباره امتحان کنید.' }, { status: 429 });
    }

    const { productDocumentId, name, rating, comment } = await req.json();
    const r = Number(rating);
    if (!productDocumentId || !name?.trim() || !comment?.trim() || !Number.isInteger(r) || r < 1 || r > 5) {
      return NextResponse.json({ error: 'اطلاعات نظر ناقص یا نامعتبر است' }, { status: 400 });
    }
    if (!STRAPI_TOKEN) return NextResponse.json({ error: 'STRAPI_API_TOKEN not set' }, { status: 500 });

    const res = await fetch(`${STRAPI_URL}/api/reviews`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        data: {
          product_document_id: productDocumentId,
          name: name.trim().slice(0, 80),
          rating: r,
          comment: comment.trim().slice(0, 1000),
          approved: false,
        },
      }),
    });
    if (!res.ok) {
      return NextResponse.json({ error: `Strapi ${res.status}: ${(await res.text()).slice(0, 200)}` }, { status: 502 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Submit review error:', err);
    return NextResponse.json({ error: 'خطا در ثبت نظر' }, { status: 500 });
  }
}
