import { unstable_cache } from 'next/cache';
import { sql } from '@/lib/db';

// Browser-safe helpers live in format.ts; re-exported for server code.
export { getImageUrl, formatPrice } from '@/lib/format';

// Data access for the storefront. Reads go straight to Postgres and are cached
// for 60s; admin writes call revalidateTag(...) so changes show immediately.
export const TAGS = { products: 'products', articles: 'articles', reviews: 'reviews' } as const;

export interface ProductImage {
  url: string;
  width?: number | null;
  height?: number | null;
  formats?: { thumbnail?: { url: string }; small?: { url: string }; medium?: { url: string } };
}

// Field names match the old Strapi API so components didn't need to change.
export interface Product {
  id: number;
  documentId: string;
  name_fa: string;
  name_en: string;
  brand: string;
  retail_price: number | null;
  wholesale_price: number | null;
  min_wholesale_qty: number;
  category: string;
  business_types: string[] | null;
  description_fa: string | null;
  description_en: string | null;
  stock_status: 'in_stock' | 'out_of_stock';
  featured: boolean;
  price_on_request: boolean;
  seo_title: string | null;
  seo_description: string | null;
  focus_keyword: string | null;
  no_index: boolean;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  images: ProductImage[];
}

export interface ListResult<T> {
  data: T[];
  meta: { pagination: { total: number; page: number; pageSize: number; pageCount: number } };
}

type Row = Record<string, any>;

export function rowToProduct(r: Row): Product {
  return {
    id: r.id,
    documentId: r.document_id,
    name_fa: r.name_fa,
    name_en: r.name_en,
    brand: r.brand,
    retail_price: r.retail_price,
    wholesale_price: r.wholesale_price,
    min_wholesale_qty: r.min_wholesale_qty,
    category: r.category,
    business_types: r.business_types,
    description_fa: r.description_fa,
    description_en: r.description_en,
    stock_status: r.stock_status,
    featured: r.featured,
    price_on_request: r.price_on_request,
    seo_title: r.seo_title,
    seo_description: r.seo_description,
    focus_keyword: r.focus_keyword,
    no_index: r.no_index,
    published: r.published,
    createdAt: new Date(r.created_at).toISOString(),
    updatedAt: new Date(r.updated_at).toISOString(),
    images: r.images ?? [],
  };
}

/**
 * Every published product, cached. The catalog is small, so filtering happens
 * in memory. Long text is trimmed/dropped to stay well under the 2MB cache
 * entry limit — use getProduct() for the full record.
 */
export const getAllProducts = unstable_cache(
  async (): Promise<Product[]> => {
    const rows = await sql`
      SELECT id, document_id, name_fa, name_en, brand, retail_price, wholesale_price,
             min_wholesale_qty, category, business_types, LEFT(description_fa, 120) AS description_fa,
             NULL AS description_en, stock_status, featured, price_on_request,
             NULL AS seo_title, NULL AS seo_description, NULL AS focus_keyword, no_index,
             published, created_at, updated_at, images
      FROM products WHERE published ORDER BY id`;
    return rows.map(rowToProduct);
  },
  ['all-products'],
  { revalidate: 60, tags: [TAGS.products] },
);

export interface ProductQuery {
  category?: string;
  businessType?: string;
  /** Substring match on brand. */
  brand?: string;
  /** Substring match on name_fa / name_en / brand. */
  q?: string;
  /** Like `q` but only on name_fa. */
  nameFa?: string;
  retailMin?: number;
  retailMax?: number;
  wholesaleMin?: number;
  wholesaleMax?: number;
  /** Only products with a real retail price (not "price on request"). */
  pricedOnly?: boolean;
  excludeDocumentId?: string;
  /** `field:asc|desc` — retail_price, createdAt */
  sort?: string;
}

const includes = (hay: string | null | undefined, needle: string) =>
  !!hay && hay.toLocaleLowerCase().includes(needle.toLocaleLowerCase());

export async function getProducts(
  query: ProductQuery = {},
  page = 1,
  pageSize = 20,
): Promise<ListResult<Product>> {
  let list = await getAllProducts();
  const { category, businessType, brand, q, nameFa, excludeDocumentId, sort } = query;

  list = list.filter(p => {
    if (category && p.category !== category) return false;
    if (businessType && !(p.business_types ?? []).some(b => includes(b, businessType))) return false;
    if (brand && !includes(p.brand, brand)) return false;
    if (q && !(includes(p.name_fa, q) || includes(p.name_en, q) || includes(p.brand, q))) return false;
    if (nameFa && !includes(p.name_fa, nameFa)) return false;
    if (excludeDocumentId && p.documentId === excludeDocumentId) return false;
    if (query.pricedOnly && (p.price_on_request || p.retail_price == null)) return false;
    if (query.retailMin != null && !(p.retail_price != null && p.retail_price >= query.retailMin)) return false;
    if (query.retailMax != null && !(p.retail_price != null && p.retail_price <= query.retailMax)) return false;
    if (query.wholesaleMin != null && !(p.wholesale_price != null && p.wholesale_price >= query.wholesaleMin)) return false;
    if (query.wholesaleMax != null && !(p.wholesale_price != null && p.wholesale_price <= query.wholesaleMax)) return false;
    return true;
  });

  if (sort) {
    const [field, dir] = sort.split(':');
    const sign = dir === 'desc' ? -1 : 1;
    const key = (p: Product): number | null =>
      field === 'retail_price' ? p.retail_price :
      field === 'createdAt' ? Date.parse(p.createdAt) : null;
    // Products without a value always go last.
    list = [...list].sort((a, b) => {
      const ka = key(a), kb = key(b);
      if (ka == null && kb == null) return 0;
      if (ka == null) return 1;
      if (kb == null) return -1;
      return (ka - kb) * sign;
    });
  }

  const total = list.length;
  const start = (page - 1) * pageSize;
  return {
    data: list.slice(start, start + pageSize),
    meta: { pagination: { total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) } },
  };
}

export const getProduct = unstable_cache(
  async (documentId: string): Promise<{ data: Product | null }> => {
    const [row] = await sql`SELECT * FROM products WHERE document_id = ${documentId} AND published`;
    return { data: row ? rowToProduct(row) : null };
  },
  ['product'],
  { revalidate: 60, tags: [TAGS.products] },
);

// Homepage "محصولات ویژه" — newest electric appliances that have a price
export async function getFeaturedProducts(): Promise<ListResult<Product>> {
  return getProducts({ category: 'electric', pricedOnly: true, sort: 'createdAt:desc' }, 1, 8);
}

// ── Blog articles (مجله) ──────────────────────────────────────────────────
export interface Article {
  id: number;
  documentId: string;
  title_fa: string;
  slug: string;
  excerpt_fa: string | null;
  content_fa: string;
  seo_title: string | null;
  seo_description: string | null;
  cover: ProductImage | null;
  publishedAt: string;
  updatedAt: string;
}

export function rowToArticle(r: Row): Article {
  return {
    id: r.id,
    documentId: r.document_id,
    title_fa: r.title_fa,
    slug: r.slug,
    excerpt_fa: r.excerpt_fa,
    content_fa: r.content_fa,
    seo_title: r.seo_title,
    seo_description: r.seo_description,
    cover: r.cover,
    publishedAt: new Date(r.published_at ?? r.created_at).toISOString(),
    updatedAt: new Date(r.updated_at).toISOString(),
  };
}

const getAllArticles = unstable_cache(
  async (): Promise<Article[]> => {
    const rows = await sql`
      SELECT * FROM articles WHERE published_at IS NOT NULL ORDER BY published_at DESC`;
    return rows.map(rowToArticle);
  },
  ['all-articles'],
  { revalidate: 60, tags: [TAGS.articles] },
);

export async function getArticles(page = 1, pageSize = 12): Promise<ListResult<Article>> {
  const all = await getAllArticles();
  const start = (page - 1) * pageSize;
  return {
    data: all.slice(start, start + pageSize),
    meta: {
      pagination: { total: all.length, page, pageSize, pageCount: Math.max(1, Math.ceil(all.length / pageSize)) },
    },
  };
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const all = await getAllArticles();
  return all.find(a => a.slug === slug) ?? null;
}

// ── Reviews ──────────────────────────────────────────────────────────────
export interface Review {
  id: number;
  documentId: string;
  name: string;
  rating: number;
  comment: string;
  approved?: boolean;
  product_document_id?: string;
  createdAt: string;
}

export function rowToReview(r: Row): Review {
  return {
    id: r.id,
    documentId: r.document_id,
    name: r.name,
    rating: r.rating,
    comment: r.comment,
    approved: r.approved,
    product_document_id: r.product_document_id,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

export const getApprovedReviews = unstable_cache(
  async (productDocumentId: string): Promise<{ reviews: Review[]; average: number; count: number }> => {
    try {
      const rows = await sql`
        SELECT * FROM reviews
        WHERE product_document_id = ${productDocumentId} AND approved
        ORDER BY created_at DESC LIMIT 100`;
      const reviews = rows.map(rowToReview);
      const count = reviews.length;
      const average = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
      return { reviews, average, count };
    } catch {
      return { reviews: [], average: 0, count: 0 };
    }
  },
  ['approved-reviews'],
  { revalidate: 60, tags: [TAGS.reviews] },
);
