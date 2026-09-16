import { NextRequest, NextResponse } from 'next/server';
import { sql, isAdmin } from '@/lib/db';

type Row = Record<string, any>;

// Same shape the admin panel used with Strapi.
function rowToOrder(r: Row) {
  return {
    id: r.id,
    documentId: r.document_id,
    order_id: r.order_id,
    type: r.type,
    customer_name: r.customer_name,
    customer_phone: r.customer_phone,
    customer_address: r.customer_address,
    customer_email: r.customer_email,
    business_name: r.business_name,
    notes: r.notes,
    items: r.items,
    total: r.total,
    status: r.status,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

// GET /api/admin/orders?password=... — list all orders, newest first
export async function GET(req: NextRequest) {
  if (!isAdmin(req.nextUrl.searchParams.get('password'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const rows = await sql`SELECT * FROM orders ORDER BY created_at DESC LIMIT 500`;
    return NextResponse.json({ orders: rows.map(rowToOrder) });
  } catch (err) {
    console.error('Load orders error:', err);
    return NextResponse.json({ error: 'خطا در بارگذاری سفارش‌ها' }, { status: 500 });
  }
}

// POST /api/admin/orders — update an order's status
// body: { password, documentId, status }
export async function POST(req: NextRequest) {
  try {
    const { password, documentId, status } = await req.json();
    if (!isAdmin(password)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!documentId || !status) {
      return NextResponse.json({ error: 'documentId و status لازم است' }, { status: 400 });
    }
    const result = await sql`
      UPDATE orders SET status = ${String(status)}, updated_at = NOW() WHERE document_id = ${documentId}`;
    if (!result.count) {
      return NextResponse.json({ error: 'به‌روزرسانی وضعیت ناموفق بود' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Update order error:', err);
    return NextResponse.json({ error: 'خطا' }, { status: 500 });
  }
}

// DELETE /api/admin/orders?password=...&documentId=... — permanently remove an order
export async function DELETE(req: NextRequest) {
  const documentId = req.nextUrl.searchParams.get('documentId');
  if (!isAdmin(req.nextUrl.searchParams.get('password'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!documentId) {
    return NextResponse.json({ error: 'documentId لازم است' }, { status: 400 });
  }
  try {
    const result = await sql`DELETE FROM orders WHERE document_id = ${documentId}`;
    if (!result.count) {
      return NextResponse.json({ error: 'حذف ناموفق بود' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete order error:', err);
    return NextResponse.json({ error: 'خطا' }, { status: 500 });
  }
}
