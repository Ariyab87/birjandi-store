// One-off: copy products, articles, orders and reviews from the old Strapi
// Postgres database into the new schema (db/schema.sql).
//
//   STRAPI_DATABASE_URL=postgres://...  DATABASE_URL=postgres://...  node scripts/migrate-from-strapi.mjs
//
// Keeps Strapi documentIds so product URLs stay the same. Re-runnable: rows are
// upserted by document_id.
import postgres from 'postgres';
import { readFileSync } from 'fs';

// Strapi stores UTC in `timestamp without time zone`; parse it as UTC.
process.env.TZ = 'UTC';

const src = postgres(process.env.STRAPI_DATABASE_URL, { max: 1 });
const dst = postgres(process.env.DATABASE_URL, { max: 1, prepare: false, onnotice: () => {} });

const MEDIA = (type, field) => src`
  SELECT m.related_id, m."order", f.url, f.width, f.height, f.formats
  FROM files_related_mph m JOIN files f ON f.id = m.file_id
  WHERE m.related_type = ${type} AND m.field = ${field}
  ORDER BY m.related_id, m."order"`;

function slimFormats(formats) {
  if (!formats) return undefined;
  const out = {};
  for (const k of ['thumbnail', 'small', 'medium', 'large']) {
    if (formats[k]?.url) out[k] = { url: formats[k].url };
  }
  return Object.keys(out).length ? out : undefined;
}

function groupMedia(rows) {
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.related_id)) map.set(r.related_id, []);
    map.get(r.related_id).push({ url: r.url, width: r.width, height: r.height, formats: slimFormats(r.formats) });
  }
  return map;
}

// Strapi v5 keeps a draft row and a published row per document. Prefer the
// published row (what the site shows); fall back to the draft for draft-only docs.
function pickRows(rows) {
  const byDoc = new Map();
  for (const r of rows) {
    const cur = byDoc.get(r.document_id);
    if (!cur || (r.published_at && !cur.published_at)) byDoc.set(r.document_id, r);
  }
  return [...byDoc.values()];
}

await dst.unsafe(readFileSync(new URL('../db/schema.sql', import.meta.url), 'utf8'));

// ── products ──
const productImages = groupMedia(await MEDIA('api::product.product', 'images'));
const products = pickRows(await src`SELECT * FROM products ORDER BY id`);
for (const p of products) {
  await dst`
    INSERT INTO products ${dst({
      id: p.id, // basket items in customers' browsers reference this id
      document_id: p.document_id,
      name_fa: p.name_fa ?? '',
      name_en: p.name_en ?? '',
      brand: p.brand ?? '',
      retail_price: p.retail_price,
      wholesale_price: p.wholesale_price,
      min_wholesale_qty: p.min_wholesale_qty ?? 1,
      category: p.category ?? '',
      business_types: p.business_types ? dst.json(p.business_types) : null,
      description_fa: p.description_fa,
      description_en: p.description_en,
      stock_status: p.stock_status ?? 'in_stock',
      featured: !!p.featured,
      price_on_request: !!p.price_on_request,
      seo_title: p.seo_title,
      seo_description: p.seo_description,
      focus_keyword: p.focus_keyword,
      no_index: !!p.no_index,
      images: dst.json(productImages.get(p.id) ?? []),
      published: !!p.published_at,
      created_at: p.created_at,
      updated_at: p.updated_at,
    })}
    ON CONFLICT (document_id) DO UPDATE SET
      name_fa = EXCLUDED.name_fa, name_en = EXCLUDED.name_en, brand = EXCLUDED.brand,
      retail_price = EXCLUDED.retail_price, wholesale_price = EXCLUDED.wholesale_price,
      min_wholesale_qty = EXCLUDED.min_wholesale_qty, category = EXCLUDED.category,
      business_types = EXCLUDED.business_types, description_fa = EXCLUDED.description_fa,
      description_en = EXCLUDED.description_en, stock_status = EXCLUDED.stock_status,
      featured = EXCLUDED.featured, price_on_request = EXCLUDED.price_on_request,
      seo_title = EXCLUDED.seo_title, seo_description = EXCLUDED.seo_description,
      focus_keyword = EXCLUDED.focus_keyword, no_index = EXCLUDED.no_index,
      images = EXCLUDED.images, published = EXCLUDED.published,
      created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at`;
}
await dst`SELECT setval(pg_get_serial_sequence('products', 'id'), (SELECT MAX(id) FROM products))`;
console.log(`products: ${products.length} (${products.filter(p => p.published_at).length} published)`);

// ── articles ──
const covers = groupMedia(await MEDIA('api::article.article', 'cover'));
const articles = pickRows(await src`SELECT * FROM articles ORDER BY id`);
for (const a of articles) {
  const cover = covers.get(a.id)?.[0] ?? null;
  await dst`
    INSERT INTO articles ${dst({
      document_id: a.document_id,
      title_fa: a.title_fa,
      slug: a.slug,
      excerpt_fa: a.excerpt_fa,
      content_fa: a.content_fa ?? '',
      seo_title: a.seo_title,
      seo_description: a.seo_description,
      cover: cover ? dst.json(cover) : null,
      published_at: a.published_at,
      created_at: a.created_at,
      updated_at: a.updated_at,
    })}
    ON CONFLICT (document_id) DO UPDATE SET
      title_fa = EXCLUDED.title_fa, slug = EXCLUDED.slug, excerpt_fa = EXCLUDED.excerpt_fa,
      content_fa = EXCLUDED.content_fa, seo_title = EXCLUDED.seo_title,
      seo_description = EXCLUDED.seo_description, cover = EXCLUDED.cover,
      published_at = EXCLUDED.published_at, updated_at = EXCLUDED.updated_at`;
}
console.log(`articles: ${articles.length} (${articles.filter(a => a.published_at).length} published)`);

// ── orders ──
const orders = pickRows(await src`SELECT * FROM orders ORDER BY id`);
for (const o of orders) {
  await dst`
    INSERT INTO orders ${dst({
      document_id: o.document_id,
      order_id: o.order_id ?? '',
      type: o.type ?? 'retail',
      customer_name: o.customer_name ?? '',
      customer_phone: o.customer_phone ?? '',
      customer_address: o.customer_address ?? '',
      customer_email: o.customer_email,
      business_name: o.business_name,
      notes: o.notes,
      items: dst.json(o.items ?? []),
      total: o.total,
      status: o.status ?? 'new',
      created_at: o.created_at,
      updated_at: o.updated_at,
    })}
    ON CONFLICT (document_id) DO UPDATE SET status = EXCLUDED.status, updated_at = EXCLUDED.updated_at`;
}
console.log(`orders: ${orders.length}`);

// ── reviews ──
const reviews = pickRows(await src`SELECT * FROM reviews ORDER BY id`);
for (const r of reviews) {
  await dst`
    INSERT INTO reviews ${dst({
      document_id: r.document_id,
      product_document_id: r.product_document_id,
      name: r.name ?? '',
      rating: r.rating,
      comment: r.comment ?? '',
      approved: !!r.approved,
      created_at: r.created_at,
      updated_at: r.updated_at,
    })}
    ON CONFLICT (document_id) DO UPDATE SET approved = EXCLUDED.approved, updated_at = EXCLUDED.updated_at`;
}
console.log(`reviews: ${reviews.length}`);

await src.end();
await dst.end();
