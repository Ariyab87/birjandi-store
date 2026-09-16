import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { sql, isAdmin, newDocumentId } from '@/lib/db';
import { rowToArticle, TAGS } from '@/lib/api';
import { uploadImage, cloudinaryConfigured } from '@/lib/cloudinary';

export const maxDuration = 60;

const FIELDS = ['title_fa', 'slug', 'excerpt_fa', 'content_fa', 'seo_title', 'seo_description'] as const;

function pickFields(article: Record<string, unknown>) {
  const data: Record<string, unknown> = {};
  for (const k of FIELDS) if (article[k] !== undefined) data[k] = article[k] === null ? null : String(article[k]);
  return data;
}

// GET ?password=... — all articles (including unpublished), newest first
export async function GET(req: NextRequest) {
  if (!isAdmin(req.nextUrl.searchParams.get('password'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const rows = await sql`SELECT * FROM articles ORDER BY created_at DESC`;
  return NextResponse.json({ articles: rows.map(r => ({ ...rowToArticle(r), published: !!r.published_at })) });
}

// POST — body: { password, article: { title_fa, slug, excerpt_fa, content_fa, seo_title, seo_description, cover_url? } }
// Creates and publishes a blog article; cover_url is fetched into Cloudinary.
// PUT  — body: { password, documentId, article: {...partial fields, cover_url?, published?} } updates an article.
async function handle(req: NextRequest, mode: 'create' | 'update') {
  try {
    const { password, article = {}, documentId } = await req.json();
    if (!isAdmin(password)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (mode === 'create' && (!article.title_fa || !article.slug || !article.content_fa)) {
      return NextResponse.json({ error: 'title_fa, slug, content_fa required' }, { status: 400 });
    }
    if (mode === 'update' && !documentId) {
      return NextResponse.json({ error: 'documentId required' }, { status: 400 });
    }

    const data: Record<string, unknown> = pickFields(article);
    let cover = false;
    if (typeof article.cover_url === 'string' && article.cover_url.startsWith('https://res.cloudinary.com/')) {
      // already uploaded through /api/admin/upload
      data.cover = sql.json({ url: article.cover_url });
      cover = true;
    } else if (article.cover_url && cloudinaryConfigured()) {
      try {
        data.cover = sql.json((await uploadImage(String(article.cover_url), 'kalaland24/articles')) as any);
        cover = true;
      } catch (err) {
        console.error('article cover upload failed:', err);
      }
    }
    if (typeof article.published === 'boolean') {
      data.published_at = article.published ? new Date() : null;
    }

    let row;
    if (mode === 'create') {
      [row] = await sql`
        INSERT INTO articles ${sql({ document_id: newDocumentId(), published_at: new Date(), ...data })}
        RETURNING *`;
    } else {
      if (!Object.keys(data).length) return NextResponse.json({ error: 'nothing to update' }, { status: 400 });
      [row] = await sql`
        UPDATE articles SET ${sql(data)}, updated_at = NOW() WHERE document_id = ${documentId} RETURNING *`;
      if (!row) return NextResponse.json({ error: 'article not found' }, { status: 404 });
    }

    revalidateTag(TAGS.articles);
    return NextResponse.json({ success: true, documentId: row.document_id, slug: row.slug, cover });
  } catch (err: any) {
    if (err?.code === '23505') return NextResponse.json({ error: 'این slug قبلاً استفاده شده است' }, { status: 409 });
    console.error('admin articles error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) { return handle(req, 'create'); }
export async function PUT(req: NextRequest) { return handle(req, 'update'); }

// DELETE ?password=...&documentId=...
export async function DELETE(req: NextRequest) {
  if (!isAdmin(req.nextUrl.searchParams.get('password'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const documentId = req.nextUrl.searchParams.get('documentId');
  if (!documentId) return NextResponse.json({ error: 'documentId required' }, { status: 400 });
  const result = await sql`DELETE FROM articles WHERE document_id = ${documentId}`;
  revalidateTag(TAGS.articles);
  return NextResponse.json({ success: result.count > 0 });
}
