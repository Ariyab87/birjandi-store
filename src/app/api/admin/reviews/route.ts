import { NextRequest, NextResponse } from 'next/server';

const ADMIN_PASSWORD = process.env.ADMIN_CHAT_PASSWORD || 'bshop-admin-2024';
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN || '';

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    ...(STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {}),
  };
}

// GET /api/admin/reviews?password=... — list pending (unapproved) reviews, newest first
export async function GET(req: NextRequest) {
  const password = req.nextUrl.searchParams.get('password');
  if (password !== ADMIN_PASSWORD) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const params = new URLSearchParams({
      'filters[approved][$eq]': 'false',
      'sort[0]': 'createdAt:desc',
      'pagination[limit]': '200',
    });
    const res = await fetch(`${STRAPI_URL}/api/reviews?${params}`, { headers: authHeaders() });
    const data = await res.json();
    return NextResponse.json({ reviews: data.data || [] });
  } catch (err) {
    console.error('Load pending reviews error:', err);
    return NextResponse.json({ error: 'خطا در بارگذاری نظرات' }, { status: 500 });
  }
}

// POST /api/admin/reviews — body: { password, documentId, action: 'approve' | 'reject' }
export async function POST(req: NextRequest) {
  try {
    const { password, documentId, action } = await req.json();
    if (password !== ADMIN_PASSWORD) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!documentId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'documentId و action معتبر لازم است' }, { status: 400 });
    }

    if (action === 'reject') {
      const res = await fetch(`${STRAPI_URL}/api/reviews/${documentId}`, { method: 'DELETE', headers: authHeaders() });
      if (!res.ok) return NextResponse.json({ error: 'حذف ناموفق بود' }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    const res = await fetch(`${STRAPI_URL}/api/reviews/${documentId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ data: { approved: true } }),
    });
    if (!res.ok) return NextResponse.json({ error: 'تأیید ناموفق بود' }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Moderate review error:', err);
    return NextResponse.json({ error: 'خطا' }, { status: 500 });
  }
}
