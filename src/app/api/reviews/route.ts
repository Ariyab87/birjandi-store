import { NextRequest, NextResponse } from 'next/server';
import { sql, newDocumentId } from '@/lib/db';
import { getApprovedReviews } from '@/lib/api';

// Reviews are only exposed through here so unapproved content never leaks and we control spam.

// GET /api/reviews?product=documentId — approved reviews only, newest first
export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get('product');
  if (!productId) return NextResponse.json({ error: 'product required' }, { status: 400 });
  return NextResponse.json(await getApprovedReviews(productId));
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

    await sql`
      INSERT INTO reviews ${sql({
        document_id: newDocumentId(),
        product_document_id: String(productDocumentId).slice(0, 64),
        name: name.trim().slice(0, 80),
        rating: r,
        comment: comment.trim().slice(0, 1000),
        approved: false,
      })}`;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Submit review error:', err);
    return NextResponse.json({ error: 'خطا در ثبت نظر' }, { status: 500 });
  }
}
