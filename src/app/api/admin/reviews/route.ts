import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { sql, isAdmin } from '@/lib/db';
import { rowToReview, TAGS } from '@/lib/api';

// GET /api/admin/reviews?password=... — list pending (unapproved) reviews, newest first
export async function GET(req: NextRequest) {
  if (!isAdmin(req.nextUrl.searchParams.get('password'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const rows = await sql`SELECT * FROM reviews WHERE NOT approved ORDER BY created_at DESC LIMIT 200`;
    return NextResponse.json({ reviews: rows.map(rowToReview) });
  } catch (err) {
    console.error('Load pending reviews error:', err);
    return NextResponse.json({ error: 'خطا در بارگذاری نظرات' }, { status: 500 });
  }
}

// POST /api/admin/reviews — body: { password, documentId, action: 'approve' | 'reject' }
export async function POST(req: NextRequest) {
  try {
    const { password, documentId, action } = await req.json();
    if (!isAdmin(password)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!documentId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'documentId و action معتبر لازم است' }, { status: 400 });
    }

    const result = action === 'reject'
      ? await sql`DELETE FROM reviews WHERE document_id = ${documentId}`
      : await sql`UPDATE reviews SET approved = TRUE, updated_at = NOW() WHERE document_id = ${documentId}`;
    if (!result.count) return NextResponse.json({ error: 'نظر یافت نشد' }, { status: 404 });

    revalidateTag(TAGS.reviews);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Moderate review error:', err);
    return NextResponse.json({ error: 'خطا' }, { status: 500 });
  }
}
