import { NextRequest, NextResponse } from 'next/server';
import { sql, isAdmin } from '@/lib/db';
import { runBulkPrice } from '@/lib/bulkPrice';

// POST /api/admin/bulk-price
// body: { password, action: 'preview'|'apply'|'undo', category, percentage, logId? }
export async function POST(req: NextRequest) {
  try {
    const { password, ...params } = await req.json();
    if (!isAdmin(password)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { status, body } = await runBulkPrice(params);
    return NextResponse.json(body, { status });
  } catch (err) {
    console.error('Bulk price error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// GET /api/admin/bulk-price — return log
export async function GET(req: NextRequest) {
  if (!isAdmin(req.nextUrl.searchParams.get('password'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const rows = await sql`SELECT * FROM price_changes ORDER BY created_at DESC LIMIT 50`;
  return NextResponse.json({
    log: rows.map(r => ({
      id: String(r.id),
      date: new Date(r.created_at).toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' }),
      category: r.category === 'all' ? 'همه دسته‌ها' : r.category,
      percentage: r.percentage,
      productsUpdated: r.products_updated,
      admin: 'admin',
      canUndo: r.can_undo,
    })),
  });
}
