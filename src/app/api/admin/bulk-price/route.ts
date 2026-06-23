import { NextRequest, NextResponse } from 'next/server';

const ADMIN_PASSWORD = process.env.ADMIN_CHAT_PASSWORD || 'bshop-admin-2024';
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN || '';

interface PriceChangeLogEntry {
  id: string;
  date: string;
  category: string;
  percentage: number;
  productsUpdated: number;
  admin: string;
  canUndo: boolean;
  snapshot: Array<{ documentId: string; name: string; oldPrice: number; newPrice: number }>;
}

// In-memory log — survives restarts only in dev; extend to DB for production
const bulkPriceLog: PriceChangeLogEntry[] = [];

async function fetchProducts(category: string) {
  const params = new URLSearchParams({ 'pagination[limit]': '500' });
  if (category !== 'all') params.set('filters[category][$eq]', category);
  const res = await fetch(`${STRAPI_URL}/api/products?${params}`);
  const data = await res.json();
  return (data.data || []) as Array<{
    documentId: string;
    name_fa: string;
    name_en: string;
    retail_price: number;
    price_on_request: boolean;
  }>;
}

// POST /api/admin/bulk-price
// body: { password, action: 'preview'|'apply'|'undo', category, percentage, logId? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password, action, category, percentage, logId } = body;

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── UNDO ──────────────────────────────────────────────────────────────────
    if (action === 'undo') {
      const entry = bulkPriceLog.find(e => e.id === logId);
      if (!entry || !entry.canUndo) {
        return NextResponse.json({ error: 'تغییری برای بازگشت یافت نشد' }, { status: 404 });
      }
      if (!STRAPI_TOKEN) {
        return NextResponse.json({ error: 'STRAPI_API_TOKEN not set' }, { status: 500 });
      }
      for (const item of entry.snapshot) {
        await fetch(`${STRAPI_URL}/api/products/${item.documentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${STRAPI_TOKEN}` },
          body: JSON.stringify({ data: { retail_price: item.oldPrice } }),
        });
      }
      entry.canUndo = false;
      return NextResponse.json({ success: true, message: `${entry.snapshot.length} محصول به قیمت قبلی بازگردانده شد` });
    }

    // ── PREVIEW ───────────────────────────────────────────────────────────────
    const products = await fetchProducts(category);
    const eligible = products.filter(p => !p.price_on_request && p.retail_price > 0);
    const preview = eligible.map(p => ({
      documentId: p.documentId,
      name: p.name_fa || p.name_en,
      oldPrice: p.retail_price,
      newPrice: Math.round(p.retail_price * (1 + percentage / 100) * 100) / 100,
    }));

    if (action === 'preview') {
      return NextResponse.json({ preview, count: preview.length });
    }

    // ── APPLY ─────────────────────────────────────────────────────────────────
    if (action === 'apply') {
      if (!STRAPI_TOKEN) {
        return NextResponse.json({ error: 'STRAPI_API_TOKEN not set' }, { status: 500 });
      }
      let updated = 0;
      for (const item of preview) {
        const res = await fetch(`${STRAPI_URL}/api/products/${item.documentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${STRAPI_TOKEN}` },
          body: JSON.stringify({ data: { retail_price: item.newPrice } }),
        });
        if (res.ok) updated++;
      }

      const logEntry: PriceChangeLogEntry = {
        id: Date.now().toString(),
        date: new Date().toLocaleString('fa-IR'),
        category: category === 'all' ? 'همه دسته‌ها' : category,
        percentage,
        productsUpdated: updated,
        admin: 'admin',
        canUndo: true,
        snapshot: preview,
      };
      bulkPriceLog.unshift(logEntry);

      return NextResponse.json({ success: true, updated, logId: logEntry.id });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('Bulk price error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// GET /api/admin/bulk-price — return log
export async function GET(req: NextRequest) {
  const pw = req.nextUrl.searchParams.get('password');
  if (pw !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ log: bulkPriceLog.slice(0, 50) });
}
