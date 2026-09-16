import { revalidateTag } from 'next/cache';
import { sql, newDocumentId } from '@/lib/db';
import { rowToProduct, TAGS, type Product } from '@/lib/api';

// Admin-side product reads/writes (includes unpublished products, full text).

const TEXT = ['name_fa', 'name_en', 'brand', 'category', 'description_fa', 'description_en',
  'seo_title', 'seo_description', 'focus_keyword'] as const;
const NUM = ['retail_price', 'wholesale_price'] as const;
const BOOL = ['featured', 'price_on_request', 'no_index', 'published'] as const;

/** Validate and normalise an incoming product patch; unknown keys are dropped. */
export function cleanProductInput(input: Record<string, any>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of TEXT) {
    if (input[k] === undefined) continue;
    const v = input[k] === null ? '' : String(input[k]).trim();
    // name/brand/category are NOT NULL; the rest store empty as NULL
    out[k] = ['name_fa', 'name_en', 'brand', 'category'].includes(k) ? v : (v || null);
  }
  for (const k of NUM) {
    if (input[k] === undefined) continue;
    const n = input[k] === null || input[k] === '' ? null : Number(input[k]);
    if (n !== null && (!Number.isFinite(n) || n < 0)) throw new Error(`${k} نامعتبر است`);
    out[k] = n;
  }
  for (const k of BOOL) if (input[k] !== undefined) out[k] = !!input[k];
  if (input.min_wholesale_qty !== undefined) {
    out.min_wholesale_qty = Math.max(1, Math.floor(Number(input.min_wholesale_qty) || 1));
  }
  if (input.stock_status !== undefined) {
    out.stock_status = input.stock_status === 'out_of_stock' ? 'out_of_stock' : 'in_stock';
  }
  if (input.business_types !== undefined) {
    const list = Array.isArray(input.business_types) ? input.business_types.map(String).filter(Boolean) : [];
    out.business_types = list.length ? sql.json(list) : null;
  }
  if (input.images !== undefined) {
    const imgs = (Array.isArray(input.images) ? input.images : [])
      .filter((i: any) => i && typeof i.url === 'string' && /^https:\/\//.test(i.url))
      .map((i: any) => ({ url: i.url, width: i.width ?? null, height: i.height ?? null, ...(i.formats ? { formats: i.formats } : {}) }));
    out.images = sql.json(imgs);
  }
  return out;
}

export async function listAllProductsAdmin(): Promise<Product[]> {
  const rows = await sql`SELECT * FROM products ORDER BY created_at DESC, id DESC`;
  return rows.map(rowToProduct);
}

export async function getProductAdmin(documentId: string): Promise<Product | null> {
  const [row] = await sql`SELECT * FROM products WHERE document_id = ${documentId}`;
  return row ? rowToProduct(row) : null;
}

export async function createProduct(input: Record<string, any>): Promise<Product> {
  const data = cleanProductInput(input);
  if (!data.name_fa) throw new Error('نام فارسی محصول لازم است');
  if (!data.category) throw new Error('دسته‌بندی لازم است');
  const [row] = await sql`
    INSERT INTO products ${sql({ document_id: newDocumentId(), name_en: '', brand: '', ...data })}
    RETURNING *`;
  revalidateTag(TAGS.products);
  return rowToProduct(row);
}

export async function updateProduct(documentId: string, input: Record<string, any>): Promise<Product | null> {
  const data = cleanProductInput(input);
  if (!Object.keys(data).length) return getProductAdmin(documentId);
  const [row] = await sql`
    UPDATE products SET ${sql(data)}, updated_at = NOW() WHERE document_id = ${documentId} RETURNING *`;
  revalidateTag(TAGS.products);
  return row ? rowToProduct(row) : null;
}

export async function deleteProduct(documentId: string): Promise<boolean> {
  const result = await sql`DELETE FROM products WHERE document_id = ${documentId}`;
  revalidateTag(TAGS.products);
  return result.count > 0;
}
