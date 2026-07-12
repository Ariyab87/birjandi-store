import { NextRequest, NextResponse } from 'next/server';

const ADMIN_PASSWORD = process.env.ADMIN_CHAT_PASSWORD || 'bshop-admin-2024';
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN || '';

// POST /api/admin/articles — body: { password, article: { title_fa, slug, excerpt_fa, content_fa, seo_title, seo_description } }
// Creates and publishes a blog article in Strapi.
export async function POST(req: NextRequest) {
  try {
    const { password, article } = await req.json();
    if (password !== ADMIN_PASSWORD) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!STRAPI_TOKEN) return NextResponse.json({ error: 'STRAPI_API_TOKEN not set' }, { status: 500 });
    if (!article?.title_fa || !article?.slug || !article?.content_fa) {
      return NextResponse.json({ error: 'title_fa, slug, content_fa required' }, { status: 400 });
    }

    const res = await fetch(`${STRAPI_URL}/api/articles?status=published`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${STRAPI_TOKEN}` },
      body: JSON.stringify({ data: article }),
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Strapi ${res.status}: ${(await res.text()).slice(0, 300)}` },
        { status: 502 },
      );
    }
    const json = await res.json();
    return NextResponse.json({ success: true, documentId: json.data?.documentId, slug: json.data?.slug });
  } catch (err) {
    console.error('admin articles error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
