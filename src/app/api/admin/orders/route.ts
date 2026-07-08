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

// GET /api/admin/orders?password=... — list all orders, newest first
export async function GET(req: NextRequest) {
  const password = req.nextUrl.searchParams.get('password');
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const params = new URLSearchParams({
      'pagination[limit]': '500',
      'sort[0]': 'createdAt:desc',
    });
    const res = await fetch(`${STRAPI_URL}/api/orders?${params}`, { headers: authHeaders() });
    const data = await res.json();
    return NextResponse.json({ orders: data.data || [] });
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
    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!documentId || !status) {
      return NextResponse.json({ error: 'documentId و status لازم است' }, { status: 400 });
    }
    const res = await fetch(`${STRAPI_URL}/api/orders/${documentId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ data: { status } }),
    });
    if (!res.ok) {
      return NextResponse.json({ error: 'به‌روزرسانی وضعیت ناموفق بود' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Update order error:', err);
    return NextResponse.json({ error: 'خطا' }, { status: 500 });
  }
}

// DELETE /api/admin/orders?password=...&documentId=... — permanently remove an order
export async function DELETE(req: NextRequest) {
  const password = req.nextUrl.searchParams.get('password');
  const documentId = req.nextUrl.searchParams.get('documentId');
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!documentId) {
    return NextResponse.json({ error: 'documentId لازم است' }, { status: 400 });
  }
  try {
    const res = await fetch(`${STRAPI_URL}/api/orders/${documentId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!res.ok) {
      return NextResponse.json({ error: 'حذف ناموفق بود' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete order error:', err);
    return NextResponse.json({ error: 'خطا' }, { status: 500 });
  }
}
