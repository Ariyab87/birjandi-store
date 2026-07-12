import { NextRequest, NextResponse } from 'next/server';

const ADMIN_PASSWORD = process.env.ADMIN_CHAT_PASSWORD || 'bshop-admin-2024';
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN || '';

export const maxDuration = 60;

// Fetches an image from a URL and uploads it to Strapi's media library
// (stored in Cloudinary). Returns the file id to attach as `cover`.
async function uploadCoverFromUrl(coverUrl: string, slug: string): Promise<number | null> {
  const imgRes = await fetch(coverUrl);
  if (!imgRes.ok) return null;
  const blob = await imgRes.blob();
  const form = new FormData();
  form.append('files', blob, `article-${slug}.jpg`);
  const up = await fetch(`${STRAPI_URL}/api/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${STRAPI_TOKEN}` },
    body: form,
  });
  if (!up.ok) return null;
  const files = await up.json();
  return files?.[0]?.id ?? null;
}

// POST — body: { password, article: { title_fa, slug, excerpt_fa, content_fa, seo_title, seo_description, cover_url? } }
// Creates and publishes a blog article; cover_url is fetched and attached as media.
// PUT  — body: { password, documentId, article: {...partial fields, cover_url?} } updates an existing article.
async function handle(req: NextRequest, mode: 'create' | 'update') {
  try {
    const { password, article, documentId } = await req.json();
    if (password !== ADMIN_PASSWORD) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!STRAPI_TOKEN) return NextResponse.json({ error: 'STRAPI_API_TOKEN not set' }, { status: 500 });
    if (mode === 'create' && (!article?.title_fa || !article?.slug || !article?.content_fa)) {
      return NextResponse.json({ error: 'title_fa, slug, content_fa required' }, { status: 400 });
    }
    if (mode === 'update' && !documentId) {
      return NextResponse.json({ error: 'documentId required' }, { status: 400 });
    }

    const data = { ...article };
    if (data.cover_url) {
      const coverId = await uploadCoverFromUrl(data.cover_url, data.slug || documentId);
      delete data.cover_url;
      if (coverId) data.cover = coverId;
    }

    const url = mode === 'create'
      ? `${STRAPI_URL}/api/articles?status=published`
      : `${STRAPI_URL}/api/articles/${documentId}?status=published`;
    const res = await fetch(url, {
      method: mode === 'create' ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${STRAPI_TOKEN}` },
      body: JSON.stringify({ data }),
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Strapi ${res.status}: ${(await res.text()).slice(0, 300)}` },
        { status: 502 },
      );
    }
    const json = await res.json();
    return NextResponse.json({ success: true, documentId: json.data?.documentId, slug: json.data?.slug, cover: !!data.cover });
  } catch (err) {
    console.error('admin articles error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) { return handle(req, 'create'); }
export async function PUT(req: NextRequest) { return handle(req, 'update'); }
