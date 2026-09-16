import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/db';
import {
  listAllProductsAdmin, getProductAdmin, createProduct, updateProduct, deleteProduct,
} from '@/lib/adminProducts';

// Product management for the admin panel. Password travels in the
// x-admin-password header (GET/DELETE) or the JSON body (POST/PUT).

const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

// GET ?documentId=... → one product; otherwise all products (incl. hidden)
export async function GET(req: NextRequest) {
  if (!isAdmin(req.headers.get('x-admin-password'))) return unauthorized();
  const documentId = req.nextUrl.searchParams.get('documentId');
  if (documentId) {
    const product = await getProductAdmin(documentId);
    return product
      ? NextResponse.json({ product })
      : NextResponse.json({ error: 'محصول یافت نشد' }, { status: 404 });
  }
  return NextResponse.json({ products: await listAllProductsAdmin() });
}

// POST { password, product } → create
export async function POST(req: NextRequest) {
  try {
    const { password, product } = await req.json();
    if (!isAdmin(password)) return unauthorized();
    return NextResponse.json({ product: await createProduct(product ?? {}) });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'خطا' }, { status: 400 });
  }
}

// PUT { password, documentId, product } → partial update
export async function PUT(req: NextRequest) {
  try {
    const { password, documentId, product } = await req.json();
    if (!isAdmin(password)) return unauthorized();
    if (!documentId) return NextResponse.json({ error: 'documentId لازم است' }, { status: 400 });
    const updated = await updateProduct(documentId, product ?? {});
    return updated
      ? NextResponse.json({ product: updated })
      : NextResponse.json({ error: 'محصول یافت نشد' }, { status: 404 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'خطا' }, { status: 400 });
  }
}

// DELETE ?documentId=...
export async function DELETE(req: NextRequest) {
  if (!isAdmin(req.headers.get('x-admin-password'))) return unauthorized();
  const documentId = req.nextUrl.searchParams.get('documentId');
  if (!documentId) return NextResponse.json({ error: 'documentId لازم است' }, { status: 400 });
  const ok = await deleteProduct(documentId);
  return ok
    ? NextResponse.json({ success: true })
    : NextResponse.json({ error: 'محصول یافت نشد' }, { status: 404 });
}
