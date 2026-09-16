import { revalidateTag } from 'next/cache';
import { sql } from '@/lib/db';
import { TAGS } from '@/lib/api';

type Snapshot = Array<{ documentId: string; name: string; oldPrice: number; newPrice: number }>;

export interface BulkPriceParams {
  action: 'preview' | 'apply' | 'undo';
  category?: string;
  percentage?: number;
  logId?: string;
}

// Percentage price change for a category, with undo. Used by the admin panel and admin chat.
export async function runBulkPrice({ action, category = 'all', percentage = 0, logId }: BulkPriceParams) {
  // ── UNDO ──
  if (action === 'undo') {
    const [entry] = await sql`SELECT * FROM price_changes WHERE id = ${Number(logId) || 0} AND can_undo`;
    if (!entry) return { status: 404, body: { error: 'تغییری برای بازگشت یافت نشد' } };
    const snapshot = entry.snapshot as Snapshot;
    await sql.begin(async tx => {
      for (const item of snapshot) {
        await tx`UPDATE products SET retail_price = ${item.oldPrice}, updated_at = NOW()
                 WHERE document_id = ${item.documentId}`;
      }
      await tx`UPDATE price_changes SET can_undo = FALSE WHERE id = ${entry.id}`;
    });
    revalidateTag(TAGS.products);
    return { status: 200, body: { success: true, message: `${snapshot.length} محصول به قیمت قبلی بازگردانده شد` } };
  }

  // ── PREVIEW ──
  const pct = Number(percentage);
  if (!Number.isFinite(pct) || pct <= -100 || pct > 1000) {
    return { status: 400, body: { error: 'درصد نامعتبر است' } };
  }
  const rows = category === 'all'
    ? await sql`SELECT document_id, name_fa, name_en, retail_price FROM products
                WHERE NOT price_on_request AND retail_price > 0 ORDER BY id`
    : await sql`SELECT document_id, name_fa, name_en, retail_price FROM products
                WHERE category = ${category} AND NOT price_on_request AND retail_price > 0 ORDER BY id`;
  const preview: Snapshot = rows.map(p => ({
    documentId: p.document_id,
    name: p.name_fa || p.name_en,
    oldPrice: p.retail_price,
    newPrice: Math.round(p.retail_price * (1 + pct / 100) * 100) / 100,
  }));

  if (action === 'preview') return { status: 200, body: { preview, count: preview.length } };

  // ── APPLY ──
  if (action === 'apply') {
    const logRow = await sql.begin(async tx => {
      for (const item of preview) {
        await tx`UPDATE products SET retail_price = ${item.newPrice}, updated_at = NOW()
                 WHERE document_id = ${item.documentId}`;
      }
      const [row] = await tx`
        INSERT INTO price_changes ${tx({
          category,
          percentage: pct,
          products_updated: preview.length,
          snapshot: tx.json(preview as any),
        })} RETURNING id`;
      return row;
    });
    revalidateTag(TAGS.products);
    return { status: 200, body: { success: true, updated: preview.length, logId: String(logRow.id) } };
  }

  return { status: 400, body: { error: 'Invalid action' } };
}
